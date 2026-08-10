import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for hosted catalogue tests.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = "BiteWise#Test2026";

test.describe("curated recipe catalogue", () => {
  test.describe.configure({ mode: "serial" });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `bitewise-catalogue-${runId}@example.com`;
  let userId = "";

  test.beforeAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw new Error("Temporary catalogue user could not be created.");
    }
    userId = created.data.user.id;
    const profile = await admin.from("profiles").upsert({
      user_id: userId,
      display_name: "Catalogue Tester",
      budget_minor: 500_000,
      budget_period: "daily",
      household_size: 4,
      available_minutes: 90,
      equipment: ["gas_cooker"],
      dietary_preferences: ["vegetarian"],
      health_goals: ["high_fibre"],
      preferred_cuisines: ["kenyan"],
      onboarding_completed: true,
    });
    if (profile.error) throw profile.error;
    const kale = await admin.from("ingredients").select("id").eq("slug", "kale").single();
    if (kale.error) throw kale.error;
    const pantry = await admin.from("pantry_items").insert({
      user_id: userId,
      ingredient_id: kale.data.id,
      quantity: 2,
      unit: "bunch",
      expiry_date: "2026-08-08",
    });
    if (pantry.error) throw pantry.error;
  });

  test.afterAll(async () => {
    if (!userId) return;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.auth.admin.deleteUser(userId);
  });

  test("Eat Now ranks hard-filtered meals with pantry-aware explanations", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/eat-now$/);
    await expect(
      page.getByRole("heading", { name: "A confident meal decision, in minutes." }),
    ).toBeVisible();
    await expect(page.getByText("30 locally relevant meals")).toBeVisible();
    await expect(page.getByText(/Nairobi estimates · actual prices vary/)).toBeVisible();
    await expect(page.getByLabel("Meal budget (KES)")).toHaveValue("1666");
    await expect(page.getByLabel("Vegetarian · saved")).toBeChecked();
    await page.getByRole("button", { name: "Find meals that fit" }).click();

    await expect(page.getByRole("heading", { name: "Best fits first" })).toBeVisible();
    await expect(page.getByText("Match 1")).toBeVisible();
    await expect(page.getByText(/Matches your cuisine, dish, or health preferences/).first()).toBeVisible();
    await expect(page.getByText(/% pantry match/).first()).toBeVisible();
    await expect(page.getByText(/KES/).first()).toBeVisible();
    await expect(page.locator("[data-slot='card']")).toHaveCount(5);
    await expect(page.getByRole("img").first()).toBeVisible();
    await expect(page.getByText(/Photo by/).first()).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("keeps each primary task above the mobile navigation at compact widths", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Compact layout is covered by the mobile project.");

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);

    const routes = [
      {
        path: "/eat-now",
        title: "A confident meal decision, in minutes.",
        task: () => page.getByRole("heading", { name: "What fits right now?" }),
      },
      {
        path: "/meal-plan?week=2026-08-10",
        title: "Make the week feel lighter.",
        task: () => page.getByRole("navigation", { name: "Choose planning week" }),
      },
      {
        path: "/discover",
        title: "Find a meal that fits the kitchen you have.",
        task: () => page.getByLabel("Search recipes"),
      },
      {
        path: "/cook",
        title: "One clear step. Then the next.",
        task: () => page.getByRole("heading", { name: /Nothing waiting on the stove|Resume cooking/ }),
      },
    ];

    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });

      for (const route of routes) {
        await page.goto(route.path);
        await expect(page.getByRole("heading", { level: 1, name: route.title })).toBeVisible();

        const intro = page.locator("[data-slot='page-intro']");
        await expect(intro).toBeVisible();
        expect(await intro.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(260);

        const task = route.task();
        await expect(task).toBeVisible();
        expect(await task.evaluate((element) => element.getBoundingClientRect().top)).toBeLessThan(704);
      }
    }
  });

  test("Eat Now keeps dietary needs fixed and offers concrete no-match adjustments", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);

    await page.getByLabel("Gas cooker").uncheck();
    await page.getByRole("button", { name: "Find meals that fit" }).click();

    await expect(page.getByRole("heading", { name: "Keep the hard rules. Adjust the situation." })).toBeVisible();
    await expect(page.getByText("Select a gas cooker, electric cooker, or jiko that you can use today.")).toBeVisible();
    await expect(page.getByText("Your dietary requirements remain fixed and were not relaxed.")).toBeVisible();
    await expect(page.getByLabel("Vegetarian · saved")).toBeChecked();
    await expect(page.getByLabel("Vegetarian · saved")).toBeDisabled();
  });

  test("public catalogue grants expose published reads but reject anonymous writes", async () => {
    const guest = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const published = await guest
      .from("recipes")
      .select("id,slug", { count: "exact" })
      .eq("is_active", true);
    expect(published.error).toBeNull();
    expect(published.count).toBe(30);

    const denied = await guest.from("recipes").insert({
      slug: "anonymous-write-must-fail",
      name: "Anonymous write must fail",
      summary: "This row must never be accepted through the anonymous Data API role.",
      cuisine: "kenyan",
      meal_types: ["lunch"],
      base_servings: 1,
      prep_minutes: 1,
      cook_minutes: 1,
      difficulty: "easy",
      instructions: ["Prepare the fixture safely.", "Confirm the fixture is rejected."],
    });
    expect(denied.error).not.toBeNull();
  });
});
