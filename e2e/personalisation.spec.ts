import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for hosted personalisation tests.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = "BiteWise#Personal2026";

async function retryHostedOperation<TResult extends { error: { message: string } | null }>(
  operation: () => PromiseLike<TResult>,
) {
  let lastMessage = "Hosted operation failed.";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await operation();
    if (!result.error) return result;
    lastMessage = result.error.message;
    if (!lastMessage.includes("JWT issued at future")) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error(lastMessage);
}

test.describe("feedback, saved meals, and history", () => {
  test.describe.configure({ mode: "serial" });
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userAEmail = `bitewise-personal-a-${runId}@example.com`;
  const userBEmail = `bitewise-personal-b-${runId}@example.com`;
  let userAId = "";
  let userBId = "";
  let recipeId = 0;
  const recipeSlug = "chapati-bean-stew";
  let recipeName = "";

  test.beforeAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [createdA, createdB] = await Promise.all([
      retryHostedOperation(() => admin.auth.admin.createUser({ email: userAEmail, password, email_confirm: true })),
      retryHostedOperation(() => admin.auth.admin.createUser({ email: userBEmail, password, email_confirm: true })),
    ]);
    if (!createdA.data.user || !createdB.data.user) throw new Error("Temporary personalisation users could not be created.");
    userAId = createdA.data.user.id;
    userBId = createdB.data.user.id;
    await retryHostedOperation(() => admin.from("profiles").upsert([
      { user_id: userAId, display_name: "Personal A", budget_minor: 500_000, budget_period: "weekly", household_size: 2, available_minutes: 120, equipment: ["gas_cooker"], onboarding_completed: true },
      { user_id: userBId, display_name: "Personal B", budget_minor: 500_000, budget_period: "weekly", household_size: 2, available_minutes: 120, equipment: ["gas_cooker"], onboarding_completed: true },
    ]));
    const recipe = await retryHostedOperation(() => admin.from("recipes").select("id,name").eq("slug", recipeSlug).single());
    recipeId = recipe.data?.id ?? 0;
    recipeName = recipe.data?.name ?? "";
  });

  test.afterAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await Promise.all([userAId, userBId].filter(Boolean).map((userId) => admin.auth.admin.deleteUser(userId)));
  });

  test("flows from a public recipe into feedback, history, and My Kitchen", async ({ page }) => {
    await page.goto(`/recipes/${recipeSlug}`);
    const signInToSave = page.getByRole("link", { name: "Sign in to save" });
    await expect(signInToSave).toBeVisible();
    await signInToSave.click();
    await expect(page).toHaveURL(/\/auth\/sign-in\?/);
    expect(new URL(page.url()).searchParams.get("next")).toBe(`/recipes/${recipeSlug}`);

    await page.getByLabel("Email address").fill(userAEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(new RegExp(`/recipes/${recipeSlug}$`));

    const like = page.getByRole("button", { name: "Like", exact: true });
    const dislike = page.getByRole("button", { name: "Dislike", exact: true });
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "true");
    await dislike.click();
    await expect(dislike).toHaveAttribute("aria-pressed", "true");
    await expect(like).toHaveAttribute("aria-pressed", "false");
    await dislike.click();
    await expect(dislike).toHaveAttribute("aria-pressed", "false");
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Recently eaten" }).click();
    await expect(page.getByRole("button", { name: "Eaten again" })).toBeVisible();

    await page.goto("/my-kitchen/saved");
    await expect(page.getByRole("heading", { name: recipeName })).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("isolates feedback, favourites, and history across users", async () => {
    const userB = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await retryHostedOperation(() => userB.auth.signInWithPassword({ email: userBEmail, password }));
    const [feedback, saved, history] = await Promise.all([
      retryHostedOperation(() => userB.from("recipe_feedback").select("recipe_id").eq("recipe_id", recipeId)),
      retryHostedOperation(() => userB.from("saved_recipes").select("recipe_id").eq("recipe_id", recipeId)),
      retryHostedOperation(() => userB.from("meal_history").select("recipe_id").eq("recipe_id", recipeId)),
    ]);
    expect(feedback.data).toEqual([]);
    expect(saved.data).toEqual([]);
    expect(history.data).toEqual([]);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [visibleFeedback, visibleSaved, visibleHistory] = await Promise.all([
      retryHostedOperation(() => admin.from("recipe_feedback").select("state").eq("user_id", userAId).eq("recipe_id", recipeId).single()),
      retryHostedOperation(() => admin.from("saved_recipes").select("recipe_id").eq("user_id", userAId).eq("recipe_id", recipeId).single()),
      retryHostedOperation(() => admin.from("meal_history").select("eaten_at").eq("user_id", userAId).eq("recipe_id", recipeId)),
    ]);
    expect(visibleFeedback.data?.state).toBe("liked");
    expect(visibleSaved.data?.recipe_id).toBe(recipeId);
    expect(visibleHistory.data).toHaveLength(1);
  });

  test("removes a disliked Eat Now result from the next ranked shortlist", async ({ page }, testInfo) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(userAEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now/);

    await page.getByRole("button", { name: "Find meals that fit" }).click();
    await expect(page.getByRole("heading", { name: "Best fits first" })).toBeVisible();
    const results = page.locator('section[aria-labelledby="recommendation-results"]');
    const firstCard = results.locator('[data-slot="card"]').first();
    const firstMealName = (await firstCard.locator("h3").textContent())?.trim();
    if (!firstMealName) throw new Error("The ranked meal did not expose a name.");

    const dislike = firstCard.getByRole("button", { name: "Dislike", exact: true });
    await dislike.click();
    await expect(dislike).toHaveAttribute("aria-pressed", "true");
    if (testInfo.project.name === "mobile-chromium") {
      await page.getByRole("button", { name: /Edit/ }).click();
    }
    await page.getByRole("button", { name: "Refresh my matches" }).click();

    await expect(
      results.getByRole("heading", { name: firstMealName, exact: true }),
    ).toHaveCount(0);
  });
});
