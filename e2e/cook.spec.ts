import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for hosted Cook Mode tests.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = "BiteWise#Cook2026";

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

test.describe("guided cooking and isolation", () => {
  test.describe.configure({ mode: "serial" });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userAEmail = `bitewise-cook-a-${runId}@example.com`;
  const userBEmail = `bitewise-cook-b-${runId}@example.com`;
  let userAId = "";
  let userBId = "";
  let recipeId = 0;
  let recipeName = "";
  let stepCount = 0;
  let expectedScaledIngredient = "";
  let completedSessionId = 0;

  test.beforeAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [createdA, createdB] = await Promise.all([
      retryHostedOperation(() => admin.auth.admin.createUser({ email: userAEmail, password, email_confirm: true })),
      retryHostedOperation(() => admin.auth.admin.createUser({ email: userBEmail, password, email_confirm: true })),
    ]);
    if (!createdA.data.user || !createdB.data.user) throw new Error("Temporary Cook Mode users could not be created.");
    userAId = createdA.data.user.id;
    userBId = createdB.data.user.id;

    await retryHostedOperation(() => admin.from("profiles").upsert([
      { user_id: userAId, display_name: "Cook A", budget_minor: 500_000, budget_period: "weekly", household_size: 4, available_minutes: 120, equipment: ["gas_cooker"], onboarding_completed: true },
      { user_id: userBId, display_name: "Cook B", budget_minor: 500_000, budget_period: "weekly", household_size: 2, available_minutes: 120, equipment: ["gas_cooker"], onboarding_completed: true },
    ]));

    const recipeResult = await retryHostedOperation(() => admin
      .from("recipes")
      .select("id,name,base_servings")
      .eq("slug", "chapati-bean-stew")
      .single());
    recipeId = recipeResult.data?.id ?? 0;
    recipeName = recipeResult.data?.name ?? "";
    if (!recipeId) throw new Error("The Cook Mode fixture recipe was not found.");

    const [stepsResult, ingredientResult] = await Promise.all([
      retryHostedOperation(() => admin.from("recipe_steps").select("step_number", { count: "exact" }).eq("recipe_id", recipeId)),
      retryHostedOperation(() => admin
        .from("recipe_ingredients")
        .select("quantity,unit")
        .eq("recipe_id", recipeId)
        .order("sort_order")
        .limit(1)
        .single()),
    ]);
    stepCount = stepsResult.count ?? 0;
    const scaledQuantity = ((ingredientResult.data?.quantity ?? 0) * 4) / (recipeResult.data?.base_servings ?? 1);
    expectedScaledIngredient = `${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(scaledQuantity)} ${ingredientResult.data?.unit}`;
  });

  test.afterAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await Promise.all([userAId, userBId].filter(Boolean).map((userId) => admin.auth.admin.deleteUser(userId)));
  });

  test("starts, scales, resumes, and completes a persisted cooking session", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(userAEmail);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now/);

    await page.goto(`/cook/${recipeId}`);
    await expect(page.getByRole("heading", { name: recipeName })).toBeVisible();
    await page.getByLabel("Servings").fill("4");
    await page.getByRole("button", { name: "Start cooking" }).click();

    await expect(page.getByText("Step 1 of " + stepCount)).toBeVisible();
    await expect(page.getByText(expectedScaledIngredient)).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Step 2 of " + stepCount)).toBeVisible();

    await page.reload();
    await expect(page.getByText("Step 2 of " + stepCount)).toBeVisible();
    await page.goto("/cook");
    await page.getByRole("link", { name: "Resume session" }).click();
    await expect(page.getByText("Step 2 of " + stepCount)).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    for (let step = 2; step < stepCount; step += 1) {
      await page.getByRole("button", { name: "Next", exact: true }).click();
      await expect(page.getByText(`Step ${step + 1} of ${stepCount}`)).toBeVisible();
    }
    await page.getByRole("button", { name: "Mark step done" }).click();
    await expect(page.getByRole("button", { name: "Finish meal" })).toBeEnabled();
    await page.getByRole("button", { name: "Finish meal" }).click();

    await expect(page).toHaveURL(/\/cook\?completed=1/);
    await expect(page.getByText("Meal complete.")).toBeVisible();

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const completed = await retryHostedOperation(() => admin
      .from("cook_sessions")
      .select("id,status,completed_at")
      .eq("user_id", userAId)
      .eq("recipe_id", recipeId)
      .eq("status", "completed")
      .single());
    completedSessionId = completed.data?.id ?? 0;
    expect(completed.data?.completed_at).toBeTruthy();
  });

  test("isolates sessions across signed-out, user A, user B, and privileged clients", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/cook");
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    const userB = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await retryHostedOperation(() => userB.auth.signInWithPassword({ email: userBEmail, password }));
    const hidden = await retryHostedOperation(() => userB.from("cook_sessions").select("id").eq("id", completedSessionId));
    expect(hidden.data).toEqual([]);
    const blocked = await retryHostedOperation(() => userB.from("cook_sessions").update({ servings: 9 }).eq("id", completedSessionId).select("id"));
    expect(blocked.data).toEqual([]);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const visible = await retryHostedOperation(() => admin.from("cook_sessions").select("id").eq("id", completedSessionId).single());
    expect(visible.data?.id).toBe(completedSessionId);
  });
});
