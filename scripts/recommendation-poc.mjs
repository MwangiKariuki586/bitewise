import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

const pocEmail = "bitewise-recommendations-poc@example.com";
const requiredRecipeSlugs = [
  "classic-githeri",
  "ugali-sukuma-wiki",
  "matoke-beef-stew",
  "chapati-bean-stew",
];
const pantrySeed = [
  { slug: "maize", quantity: 600, unit: "g", expiresInDays: 30 },
  { slug: "dried-beans", quantity: 600, unit: "g", expiresInDays: 60 },
  { slug: "maize-flour", quantity: 1_000, unit: "g", expiresInDays: 45 },
  { slug: "kale", quantity: 2, unit: "bunch", expiresInDays: 2 },
  { slug: "tomato", quantity: 8, unit: "piece", expiresInDays: 3 },
  { slug: "onion", quantity: 6, unit: "piece", expiresInDays: 14 },
  { slug: "cooking-oil", quantity: 500, unit: "ml", expiresInDays: 90 },
  { slug: "salt", quantity: 500, unit: "g", expiresInDays: 180 },
];

function fail(message) {
  throw new Error(message);
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) fail(`${name} is required. Load the BiteWise .env file.`);
  return value;
}

function isLocalSupabase(url) {
  const hostname = new URL(url).hostname;
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function dateKey(daysFromToday) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function generatedPassword() {
  return `Bw!${randomBytes(12).toString("base64url")}9aA`;
}

function validatePassword(password) {
  if (
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    fail("The POC password must be at least 12 characters with upper, lower, number, and symbol characters.");
  }
}

async function findPocUser(admin) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) fail(`Could not inspect Auth users: ${error.message}`);
    const match = data.users.find((user) => user.email === pocEmail);
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  fail("The POC user lookup exceeded 2,000 Auth users.");
}

async function selectBySlug(admin, table, slugs, columns) {
  const { data, error } = await admin.from(table).select(columns).in("slug", slugs);
  if (error) fail(`Could not load ${table}: ${error.message}`);
  const rowsBySlug = new Map(data.map((row) => [row.slug, row]));
  const missing = slugs.filter((slug) => !rowsBySlug.has(slug));
  if (missing.length) fail(`Missing ${table} seed rows: ${missing.join(", ")}`);
  return rowsBySlug;
}

async function seed(admin, requestedPassword) {
  const existing = await findPocUser(admin);
  if (existing) {
    const { error } = await admin.auth.admin.deleteUser(existing.id);
    if (error) fail(`Could not reset the existing POC user: ${error.message}`);
  }

  const password = requestedPassword || generatedPassword();
  validatePassword(password);
  const created = await admin.auth.admin.createUser({
    email: pocEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Recommendation POC" },
  });
  if (created.error || !created.data.user) {
    fail(`Could not create the POC user: ${created.error?.message ?? "unknown error"}`);
  }
  const userId = created.data.user.id;

  const ingredientsBySlug = await selectBySlug(
    admin,
    "ingredients",
    pantrySeed.map((item) => item.slug),
    "id,slug,default_unit",
  );
  const recipesBySlug = await selectBySlug(
    admin,
    "recipes",
    requiredRecipeSlugs,
    "id,slug,name",
  );

  const profile = await admin.from("profiles").upsert({
    user_id: userId,
    display_name: "Recommendation POC",
    budget_minor: 75_000,
    budget_period: "daily",
    household_size: 4,
    available_minutes: 90,
    eat_now_minutes: 90,
    breakfast_minutes: 35,
    lunch_minutes: 60,
    dinner_minutes: 90,
    equipment: ["gas_cooker", "refrigerator"],
    dietary_preferences: [],
    health_goals: ["high_fibre", "balanced_eating"],
    preferred_cuisines: ["kenyan"],
    preferred_dishes: ["githeri", "ugali"],
    onboarding_completed: true,
  });
  if (profile.error) fail(`Could not seed the POC profile: ${profile.error.message}`);

  const pantry = await admin.from("pantry_items").insert(
    pantrySeed.map((item) => {
      const ingredient = ingredientsBySlug.get(item.slug);
      if (ingredient.default_unit !== item.unit) {
        fail(`Pantry unit mismatch for ${item.slug}: expected ${ingredient.default_unit}.`);
      }
      return {
        user_id: userId,
        ingredient_id: ingredient.id,
        quantity: item.quantity,
        unit: item.unit,
        expiry_date: dateKey(item.expiresInDays),
        notes: "Recommendation POC seed",
      };
    }),
  );
  if (pantry.error) fail(`Could not seed the POC pantry: ${pantry.error.message}`);

  const feedback = await admin.from("recipe_feedback").insert([
    {
      user_id: userId,
      recipe_id: recipesBySlug.get("classic-githeri").id,
      state: "liked",
    },
    {
      user_id: userId,
      recipe_id: recipesBySlug.get("matoke-beef-stew").id,
      state: "disliked",
    },
  ]);
  if (feedback.error) fail(`Could not seed recommendation feedback: ${feedback.error.message}`);

  const saved = await admin.from("saved_recipes").insert({
    user_id: userId,
    recipe_id: recipesBySlug.get("ugali-sukuma-wiki").id,
  });
  if (saved.error) fail(`Could not seed the saved recipe: ${saved.error.message}`);

  const history = await admin.from("meal_history").insert({
    user_id: userId,
    recipe_id: recipesBySlug.get("chapati-bean-stew").id,
    source: "manual",
    eaten_at: new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString(),
  });
  if (history.error) fail(`Could not seed meal history: ${history.error.message}`);

  console.log(JSON.stringify({
    status: "seeded",
    email: pocEmail,
    password,
    seededSignals: {
      pantryItems: pantrySeed.length,
      liked: "classic-githeri",
      disliked: "matoke-beef-stew",
      saved: "ugali-sukuma-wiki",
      recentlyEaten: "chapati-bean-stew",
    },
    next: "Sign in, generate Eat Now results, open a recipe, and use Like or Save. Then run the verify command.",
  }, null, 2));
}

function eventCounts(events) {
  return events.reduce((counts, event) => {
    counts[event.event_type] = (counts[event.event_type] ?? 0) + 1;
    return counts;
  }, {});
}

async function verify(admin) {
  const user = await findPocUser(admin);
  if (!user) fail("The recommendation POC user does not exist. Run the seed command first.");

  const [profile, pantry, feedback, saved, history, runs] = await Promise.all([
    admin.from("profiles").select("onboarding_completed").eq("user_id", user.id).single(),
    admin.from("pantry_items").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("archived_at", null),
    admin.from("recipe_feedback").select("recipe_id,state").eq("user_id", user.id),
    admin.from("saved_recipes").select("recipe_id").eq("user_id", user.id),
    admin.from("meal_history").select("recipe_id").eq("user_id", user.id),
    admin.from("recommendation_runs").select("id,scoring_version,context,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(2),
  ]);
  for (const result of [profile, pantry, feedback, saved, history, runs]) {
    if (result.error) fail(`POC verification query failed: ${result.error.message}`);
  }

  const seedReady = profile.data.onboarding_completed &&
    (pantry.count ?? 0) === pantrySeed.length &&
    feedback.data.length >= 2 && saved.data.length >= 1 && history.data.length >= 1;
  if (!seedReady) fail("The POC baseline is incomplete. Run the seed command again.");

  if (!runs.data.length) {
    console.log(JSON.stringify({
      status: "waiting-for-ui-run",
      seedReady: true,
      next: "Sign in to BiteWise with the seeded account and click Find meals that fit.",
    }, null, 2));
    process.exitCode = 2;
    return;
  }

  const runIds = runs.data.map((run) => run.id);
  const [items, events] = await Promise.all([
    admin.from("recommendation_run_items").select("run_id,position,score,cash_needed_minor,pantry_coverage_percent,recipe_id,recipes(name,slug)").in("run_id", runIds).order("position"),
    admin.from("recommendation_events").select("run_id,event_type,recipe_id,created_at").in("run_id", runIds).order("created_at"),
  ]);
  if (items.error) fail(`Could not inspect recommendation items: ${items.error.message}`);
  if (events.error) fail(`Could not inspect recommendation events: ${events.error.message}`);

  const summaries = runs.data.map((run) => {
    const runItems = items.data.filter((item) => item.run_id === run.id);
    const runEvents = events.data.filter((event) => event.run_id === run.id);
    return {
      runId: run.id,
      createdAt: run.created_at,
      scoringVersion: run.scoring_version,
      shortlist: runItems.map((item) => ({
        position: item.position,
        recipe: item.recipes?.name ?? `Recipe ${item.recipe_id}`,
        slug: item.recipes?.slug ?? null,
        score: item.score,
        cashNeededKes: Math.ceil(item.cash_needed_minor / 100),
        pantryCoveragePercent: item.pantry_coverage_percent,
      })),
      events: eventCounts(runEvents),
    };
  });
  const latest = summaries[0];
  const latestRecipeSlugs = latest.shortlist.map((item) => item.slug);
  const uniqueRecipeCount = new Set(latestRecipeSlugs).size;
  const allEventTypes = new Set(events.data.map((event) => event.event_type));
  const checks = {
    scoringVersion: latest.scoringVersion === "eat-now-v2",
    fiveUniqueMeals: latest.shortlist.length === 5 && uniqueRecipeCount === 5,
    dislikedMealExcluded: !latestRecipeSlugs.includes("matoke-beef-stew"),
    impressionsRecorded: (latest.events.impression ?? 0) >= latest.shortlist.length,
    detailOpenAttributed: allEventTypes.has("opened"),
    dislikeAttributed: allEventTypes.has("disliked"),
  };
  if (Object.values(checks).some((passed) => !passed)) {
    console.log(JSON.stringify({ status: "failed", checks, runs: summaries }, null, 2));
    process.exitCode = 1;
    return;
  }

  const previousSlugs = new Set(summaries[1]?.shortlist.map((item) => item.slug) ?? []);
  console.log(JSON.stringify({
    status: "passed",
    checks,
    latestRun: latest,
    comparison: summaries[1] ? {
      addedSincePrevious: latestRecipeSlugs.filter((slug) => !previousSlugs.has(slug)),
      removedSincePrevious: [...previousSlugs].filter((slug) => !latestRecipeSlugs.includes(slug)),
      previousRunEvents: summaries[1].events,
    } : null,
  }, null, 2));
}

async function exercise(password) {
  if (!password) fail("The exercise command requires the password printed by the seed command via --password=...");
  validatePassword(password);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.goto(new URL("/auth/sign-in", siteUrl).toString());
    await page.getByLabel("Email address").fill(pocEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/eat-now$/);

    await page.getByRole("button", { name: "Find meals that fit" }).click();
    await page.getByRole("heading", { name: "Best fits first" }).waitFor();
    const firstRunCards = page.locator("[data-slot='card']");
    if (await firstRunCards.count() !== 5) fail("The first UI run did not return five recommendation cards.");
    if (await page.getByText("Matoke Beef Stew", { exact: true }).count()) {
      fail("The pre-seeded disliked recipe appeared in the shortlist.");
    }
    const firstRunNames = await firstRunCards.locator("h3").allTextContents();

    await firstRunCards.first().getByRole("link", { name: /View details/ }).click();
    await page.waitForURL(/\/recipes\//);
    await page.goBack();
    await page.getByRole("heading", { name: "Best fits first" }).waitFor();

    const dislikedCard = page.locator("[data-slot='card']").last();
    const dislikedName = (await dislikedCard.locator("h3").textContent())?.trim();
    if (!dislikedName) fail("Could not identify the recipe selected for dislike feedback.");
    await dislikedCard.getByRole("button", { name: "Dislike" }).click();
    await dislikedCard.getByRole("button", { name: "Dislike" }).waitFor();

    await page.getByRole("button", { name: /Edit/ }).click();
    await page.getByRole("button", { name: "Refresh my matches" }).click();
    await page.getByRole("heading", { name: "Best fits first" }).waitFor();
    const secondRunCards = page.locator("[data-slot='card']");
    if (await secondRunCards.count() !== 5) fail("The second UI run did not return five recommendation cards.");
    if (await page.getByText(dislikedName, { exact: true }).count()) {
      fail(`The newly disliked recipe remained in the refreshed shortlist: ${dislikedName}`);
    }
    const secondRunNames = await secondRunCards.locator("h3").allTextContents();

    console.log(JSON.stringify({
      status: "exercised",
      firstRun: firstRunNames,
      disliked: dislikedName,
      secondRun: secondRunNames,
      next: "Run the verify command to inspect persisted scoring and event evidence.",
    }, null, 2));
  } finally {
    await browser.close();
  }
}

async function cleanup(admin) {
  const user = await findPocUser(admin);
  if (!user) {
    console.log(JSON.stringify({ status: "already-clean", email: pocEmail }, null, 2));
    return;
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) fail(`Could not remove the POC user: ${error.message}`);
  console.log(JSON.stringify({
    status: "cleaned",
    email: pocEmail,
    detail: "The Auth user and cascade-owned POC rows were removed.",
  }, null, 2));
}

async function main() {
  const command = process.argv[2];
  if (!new Set(["seed", "exercise", "verify", "cleanup"]).has(command)) {
    fail("Usage: npm run poc:recommendations -- <seed|exercise|verify|cleanup> [--allow-hosted] [--password=StrongPassword]");
  }
  const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
  const allowHosted = process.argv.includes("--allow-hosted");
  if (!isLocalSupabase(supabaseUrl) && !allowHosted) {
    fail("This targets a hosted Supabase project. Re-run with --allow-hosted after confirming it is a development/staging project.");
  }
  const passwordArgument = process.argv.find((argument) => argument.startsWith("--password="));
  const password = passwordArgument?.slice("--password=".length);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (command === "seed") await seed(admin, password);
  if (command === "exercise") await exercise(password);
  if (command === "verify") await verify(admin);
  if (command === "cleanup") await cleanup(admin);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Recommendation POC failed.");
    process.exitCode = 1;
  });
}

export { eventCounts, isLocalSupabase, validatePassword };
