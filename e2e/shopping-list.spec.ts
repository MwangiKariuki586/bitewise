import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for hosted shopping-list tests.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = "BiteWise#Shop2026";

interface CloudReadResult<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

async function retryCloudRead<T>(operation: () => PromiseLike<CloudReadResult<T>>): Promise<T> {
  let value: T | null = null;
  await expect.poll(async () => {
    const result = await operation();
    if (!result.error && result.data !== null) value = result.data;
    return result.error?.code ?? (result.data === null ? "missing" : "ok");
  }, { timeout: 15_000, intervals: [500, 1_000, 2_000] }).toBe("ok");
  if (value === null) throw new Error("The hosted shopping-list row was not returned.");
  return value as T;
}

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

test.describe("shopping list aggregation and isolation", () => {
  test.describe.configure({ mode: "serial" });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userAEmail = `bitewise-shop-a-${runId}@example.com`;
  const userBEmail = `bitewise-shop-b-${runId}@example.com`;
  let userAId = "";
  let userBId = "";
  let mealPlanId = 0;
  let coveredIngredientName = "";

  test.beforeAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [createdA, createdB] = await Promise.all([
      retryHostedOperation(() => admin.auth.admin.createUser({ email: userAEmail, password, email_confirm: true })),
      retryHostedOperation(() => admin.auth.admin.createUser({ email: userBEmail, password, email_confirm: true })),
    ]);
    if (!createdA.data.user || !createdB.data.user) throw new Error("Temporary shopping-list users could not be created.");
    userAId = createdA.data.user.id;
    userBId = createdB.data.user.id;

    await retryHostedOperation(() => admin.from("profiles").upsert([
      { user_id: userAId, display_name: "Shopping A", budget_minor: 5_000_000, budget_period: "weekly", household_size: 2, available_minutes: 480, equipment: ["gas_cooker"], onboarding_completed: true },
      { user_id: userBId, display_name: "Shopping B", budget_minor: 5_000_000, budget_period: "weekly", household_size: 2, available_minutes: 480, equipment: ["gas_cooker"], onboarding_completed: true },
    ]));

    const userA = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await retryHostedOperation(() => userA.auth.signInWithPassword({ email: userAEmail, password }));
    const candidates = await retryHostedOperation(() => userA.rpc("get_recommendation_candidates", {
      p_budget_minor: 5_000_000,
      p_dietary: [],
      p_equipment: ["gas_cooker"],
      p_max_minutes: 480,
      p_meal_type: "lunch",
      p_servings: 2,
    }));
    const recipeId = candidates.data?.[0]?.recipe_id;
    if (!recipeId) throw new Error("A hosted shopping-list recipe candidate was not found.");

    const replaced = await retryHostedOperation(() => userA.rpc("replace_weekly_meal_plan", {
      p_week_start: "2026-08-10",
      p_budget_limit_minor: 5_000_000,
      p_items: [{ day_of_week: 0, meal_type: "lunch", recipe_id: recipeId, servings: 2 }],
    }));
    mealPlanId = replaced.data?.[0]?.meal_plan_id ?? 0;
    if (!mealPlanId) throw new Error("The hosted source meal plan was not created.");

    const ingredient = await retryCloudRead<{
      ingredient_id: number;
      unit: string;
      ingredient: { name: string };
    }>(() => admin
      .from("recipe_ingredients")
      .select("ingredient_id,unit,ingredient:ingredients!recipe_ingredients_ingredient_fkey(name)")
      .eq("recipe_id", recipeId)
      .eq("is_optional", false)
      .order("sort_order")
      .limit(1)
      .single());
    coveredIngredientName = ingredient.ingredient.name;
    await retryHostedOperation(() => admin.from("pantry_items").insert({
      user_id: userAId,
      ingredient_id: ingredient.ingredient_id,
      quantity: 999_999,
      unit: ingredient.unit,
      expiry_date: "2099-01-01",
    }));
  });

  test.afterAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await Promise.all([userAId, userBId].filter(Boolean).map((userId) => admin.auth.admin.deleteUser(userId)));
  });

  test("flows from a pantry-aware plan through a persistent editable shopping list", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(userAEmail);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);

    await page.goto("/meal-plan?week=2026-08-10");
    await page.getByRole("button", { name: "Build shopping list" }).click();
    await expect(page.getByText(/Shopping list ready with/)).toBeVisible();
    await page.getByRole("link", { name: "Open list" }).click();
    await expect(page).toHaveURL(/\/my-kitchen\/shopping-list$/);
    await expect(page.getByRole("heading", { name: "Everything the week still needs." })).toBeVisible();
    await expect(page.getByRole("heading", { name: coveredIngredientName })).toHaveCount(0);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const list = await retryCloudRead<{ id: number }>(() => admin
      .from("shopping_lists")
      .select("id")
      .eq("user_id", userAId)
      .eq("meal_plan_id", mealPlanId)
      .single());
    const generatedItem = await retryCloudRead<{ id: number; name: string }>(() => admin
      .from("shopping_list_items")
      .select("id,name")
      .eq("shopping_list_id", list.id)
      .eq("source", "generated")
      .order("id")
      .limit(1)
      .single());

    await page.getByRole("button", { name: `Mark ${generatedItem.name} as bought` }).click();
    await expect(page.getByRole("button", { name: `Move ${generatedItem.name} back to buy` })).toBeVisible();

    await page.getByRole("textbox", { name: "Item", exact: true }).fill("Dish soap");
    await page.getByLabel("Quantity", { exact: true }).fill("1");
    await page.getByLabel("Estimated cost (KES)").fill("250");
    await page.getByRole("button", { name: "Add manual item" }).click();
    await expect(page.getByRole("heading", { name: "Dish soap" })).toBeVisible();

    await page.getByRole("button", { name: "Edit Dish soap" }).click();
    await page.getByLabel("Quantity for Dish soap").fill("2");
    await page.getByLabel("Estimated cost for Dish soap (KES)").fill("500");
    await page.getByRole("button", { name: "Save item" }).click();
    await expect(page.getByText("2 piece · KES 500")).toBeVisible();

    await page.goto("/meal-plan?week=2026-08-10");
    await page.getByRole("button", { name: "Build shopping list" }).click();
    await expect(page.getByText(/Shopping list ready with/)).toBeVisible();
    await page.goto("/my-kitchen/shopping-list");
    await expect(page.getByRole("heading", { name: "Dish soap" })).toBeVisible();
    await expect(page.getByRole("button", { name: `Move ${generatedItem.name} back to buy` })).toBeVisible();

    await page.getByRole("button", { name: "Delete Dish soap" }).click();
    await expect(page.getByRole("heading", { name: "Dish soap" })).toHaveCount(0);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("isolates lists across signed-out, user A, user B, and privileged clients", async () => {
    const guest = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const guestRead = await guest.from("shopping_lists").select("id");
    expect(guestRead.error).not.toBeNull();

    const userB = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await retryHostedOperation(() => userB.auth.signInWithPassword({ email: userBEmail, password }));
    const hidden = await userB.from("shopping_lists").select("id").eq("user_id", userAId);
    expect(hidden.error).toBeNull();
    expect(hidden.data).toEqual([]);
    const denied = await userB.rpc("regenerate_shopping_list", { p_meal_plan_id: mealPlanId });
    expect(denied.error).not.toBeNull();

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const privileged = await admin.from("shopping_lists").select("id,user_id").eq("user_id", userAId).single();
    expect(privileged.error).toBeNull();
    expect(privileged.data?.user_id).toBe(userAId);
  });
});
