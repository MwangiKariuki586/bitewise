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

  test("Eat Now ranks hard-filtered meals with pantry-aware explanations", async ({ page }, testInfo) => {
    if (testInfo.project.name === "desktop-chromium") {
      await page.setViewportSize({ width: 1600, height: 1000 });
    }
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/eat-now$/);
    await expect(
      page.getByRole("heading", { name: "A confident meal decision, in minutes." }),
    ).toBeVisible();
    await expect(page.getByText("30 locally relevant meals")).toBeVisible();
    await expect(page.getByLabel("Meal budget (KES)")).toHaveValue("1666");
    await expect(page.getByLabel("Vegetarian · saved")).toBeChecked();
    await page.getByRole("button", { name: "Find meals that fit" }).click();

    await expect(page.getByRole("heading", { name: "Best fits first" })).toBeVisible();
    const resultsSection = page.locator('section[aria-labelledby="recommendation-results"]');
    await expect.poll(
      () => resultsSection.evaluate((element) => element.getBoundingClientRect().top),
    ).toBeLessThan(120);
    expect(
      await resultsSection.evaluate((element) => element.getBoundingClientRect().top),
    ).toBeGreaterThanOrEqual(60);
    await expect(page.getByText("Match 1")).toBeVisible();
    await expect(page.getByText(/From pantry/).first()).toBeVisible();
    await expect(page.getByText(/KES/).first()).toBeVisible();
    await expect(page.locator("[data-slot='card']")).toHaveCount(5);
    await expect(page.getByRole("img").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /View details/ }).first()).toHaveAttribute("href", /\/recipes\//);
    if (testInfo.project.name === "desktop-chromium") {
      const firstCard = page.locator("[data-slot='card']").first();
      const [cardBox, imageBox, detailsBox] = await Promise.all([
        firstCard.boundingBox(),
        firstCard.getByRole("img").boundingBox(),
        firstCard.getByRole("link", { name: /View details/ }).boundingBox(),
      ]);
      expect(cardBox?.height).toBeLessThanOrEqual(160);
      expect(Math.abs((imageBox?.y ?? 0) - (cardBox?.y ?? 0))).toBeLessThanOrEqual(12);
      expect(Math.abs((detailsBox?.y ?? 0) - (cardBox?.y ?? 0))).toBeLessThanOrEqual(20);
    }
    if (testInfo.project.name === "mobile-chromium") {
      await expect(page.getByLabel("Meal budget (KES)")).toHaveCount(0);
      await expect(page.getByText("KES 1,666", { exact: true })).toBeVisible();
    } else {
      await expect(page.getByLabel("Meal budget (KES)")).toHaveValue("1666");
    }

    await page.getByLabel("Sort by").selectOption("cost");
    await page.getByRole("link", { name: /View details/ }).first().click();
    await expect(page).toHaveURL(/\/recipes\//);
    const recipeUrl = page.url();
    await page.getByRole("button", { name: "Start cooking" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: "Servings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Begin cooking" })).toBeVisible();
    expect(page.url()).toBe(recipeUrl);
    await page.getByRole("button", { name: "Close cook setup" }).click();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Best fits first" })).toBeVisible();
    await expect(page.getByLabel("Sort by")).toHaveValue("cost");
    if (testInfo.project.name === "mobile-chromium") {
      await expect(page.getByText("KES 1,666", { exact: true })).toBeVisible();
    } else {
      await expect(page.getByLabel("Meal budget (KES)")).toHaveValue("1666");
    }

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("keeps each primary task above the mobile navigation at compact widths", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Compact layout is covered by the mobile project.");

    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);

    const routes = [
      {
        path: "/eat-now",
        title: "A confident meal decision, in minutes.",
        task: () => page.getByRole("button", { name: "Find meals that fit" }),
      },
      {
        path: "/meal-plan?week=2026-08-10",
        title: "Make the week feel lighter.",
        task: () => page.getByRole("group", { name: "Choose a day" }),
      },
      {
        path: "/discover",
        title: "Find a meal that fits the kitchen you have.",
        task: () => page.getByLabel("Search recipes"),
      },
      {
        path: "/cook",
        title: "One clear step. Then the next.",
        task: () => page.getByRole("button", { name: "Start cooking" }).first(),
      },
    ];

    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });

      for (const route of routes) {
        await page.goto(route.path);
        await expect(page.getByRole("heading", { level: 1, name: route.title })).toBeVisible();

        const intro = page.locator("[data-slot='page-intro']");
        await expect(intro).toBeVisible();
        const introLimit = route.path === "/discover" || route.path === "/cook" ? 150 : 180;
        expect(await intro.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(introLimit);

        const task = route.task();
        if (route.path === "/eat-now") {
          await task.evaluate((element) => {
            const targetTop = window.scrollY + element.getBoundingClientRect().top - 300;
            window.scrollTo({ top: targetTop, behavior: "instant" });
          });
        }
        await expect(task).toBeVisible();
        const navigation = page.locator("[data-slot='bottom-navigation']");
        const [taskBox, navigationBox, mainPaddingBottom] = await Promise.all([
          task.boundingBox(),
          navigation.boundingBox(),
          page.locator("#main-content").evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).paddingBottom),
          ),
        ]);
        expect(taskBox).not.toBeNull();
        expect(navigationBox).not.toBeNull();
        expect(
          (taskBox?.y ?? 800) + (taskBox?.height ?? 0),
          `${route.path} should expose its primary task above navigation`,
        ).toBeLessThanOrEqual(
          navigationBox?.y ?? 0,
        );
        expect(mainPaddingBottom).toBeGreaterThan(navigationBox?.height ?? 0);

        if (route.path === "/discover") {
          const resultCard = page.locator("[data-slot='card']").first();
          expect(await resultCard.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(180);
        }

        if (route.path === "/cook") {
          const starterCard = page
            .locator("[data-slot='card']")
            .filter({ has: page.getByRole("button", { name: "Start cooking" }) })
            .first();
          expect(await starterCard.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(180);
        }
      }
    }
  });

  test("Eat Now keeps dietary needs fixed and offers concrete no-match adjustments", async ({ page }, testInfo) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);

    await page.getByText("More constraints", { exact: true }).click();
    await page.getByLabel("Gas cooker").uncheck();
    await page.getByRole("button", { name: "Find meals that fit" }).click();

    await expect(page.getByRole("heading", { name: "Keep the hard rules. Adjust the situation." })).toBeVisible();
    await expect(page.getByText("Select a gas cooker, electric cooker, or jiko that you can use today.")).toBeVisible();
    await expect(page.getByText("Your dietary requirements remain fixed and were not relaxed.")).toBeVisible();
    if (testInfo.project.name === "mobile-chromium") {
      await page.getByRole("button", { name: /Edit/ }).click();
    }
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
