import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Locator } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for hosted meal plan tests.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = "BiteWise#Plan2026";

async function clickCentered(locator: Locator) {
  await locator.evaluate((element) => {
    element.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    if (!target || (target !== element && !element.contains(target))) {
      throw new Error("The control is obscured at its visible center point.");
    }
    (element as HTMLButtonElement).click();
  });
}

interface CloudReadResult<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

async function retryCloudRead<T>(
  operation: () => PromiseLike<CloudReadResult<T>>,
): Promise<NonNullable<T>> {
  let value: NonNullable<T> | null = null;
  await expect.poll(async () => {
    const result = await operation();
    if (!result.error && result.data !== null) value = result.data as NonNullable<T>;
    return result.error?.code ?? (result.data === null ? "missing" : "ok");
  }, { timeout: 10_000, intervals: [500, 1_000, 2_000] }).toBe("ok");
  if (value === null) throw new Error("The hosted verification row was not returned.");
  return value;
}

async function retryHostedOperation<
  TResult extends { error: { code?: string; message: string } | null },
>(
  operation: () => PromiseLike<TResult>,
): Promise<TResult> {
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

test.describe("weekly meal planning", () => {
  test.describe.configure({ mode: "serial" });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userAEmail = `bitewise-plan-a-${runId}@example.com`;
  const userBEmail = `bitewise-plan-b-${runId}@example.com`;
  let userAId = "";
  let userBId = "";

  test.beforeAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [userA, userB] = await Promise.all([
      retryHostedOperation(() =>
        admin.auth.admin.createUser({ email: userAEmail, password, email_confirm: true }),
      ),
      retryHostedOperation(() =>
        admin.auth.admin.createUser({ email: userBEmail, password, email_confirm: true }),
      ),
    ]);
    if (!userA.data.user || !userB.data.user) {
      throw new Error("Temporary meal plan users could not be created.");
    }
    userAId = userA.data.user.id;
    userBId = userB.data.user.id;
    await retryHostedOperation(() =>
      admin.from("profiles").upsert([
        {
          user_id: userAId,
          display_name: "Weekly Planner A",
          budget_minor: 5_000_000,
          budget_period: "weekly",
          household_size: 2,
          available_minutes: 180,
          equipment: ["gas_cooker"],
          dietary_preferences: [],
          health_goals: ["balanced_eating"],
          preferred_cuisines: ["kenyan"],
          onboarding_completed: true,
        },
        {
          user_id: userBId,
          display_name: "Weekly Planner B",
          budget_minor: 5_000_000,
          budget_period: "weekly",
          household_size: 2,
          available_minutes: 180,
          equipment: ["gas_cooker"],
          dietary_preferences: [],
          health_goals: [],
          preferred_cuisines: ["kenyan"],
          onboarding_completed: true,
        },
      ]),
    );
  });

  test.afterAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await Promise.all(
      [userAId, userBId].filter(Boolean).map((userId) => admin.auth.admin.deleteUser(userId)),
    );
  });

  test("generates, swaps, resizes, removes, and manually restores a full week", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(userAEmail);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);

    await page.goto("/meal-plan?week=2026-08-10");
    await expect(page.getByRole("heading", { name: "Make the week feel lighter." })).toBeVisible();
    await expect(page.getByText("Open meal slot")).toHaveCount(21);
    await page.getByRole("button", { name: "Generate complete week" }).click();

    await expect(page.getByRole("button", { name: "Swap" })).toHaveCount(21);
    await expect(page.getByText("21 of 21 meals")).toBeVisible();
    await expect(page.getByText(/without repeating a recipe/)).toBeVisible();

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const beforeSwap = await retryCloudRead<{ recipe_id: number }>(() =>
      admin
        .from("meal_plan_items")
        .select("recipe_id")
        .eq("user_id", userAId)
        .eq("day_of_week", 0)
        .eq("meal_type", "breakfast")
        .single(),
    );

    await clickCentered(page.getByRole("button", { name: "Swap" }).first());
    await expect(page.getByText("Meal swapped within your constraints.")).toBeVisible();
    const afterSwap = await retryCloudRead<{ recipe_id: number }>(() =>
      admin
        .from("meal_plan_items")
        .select("recipe_id")
        .eq("user_id", userAId)
        .eq("day_of_week", 0)
        .eq("meal_type", "breakfast")
        .single(),
    );
    expect(afterSwap.recipe_id).not.toBe(beforeSwap.recipe_id);

    await page.getByLabel("Breakfast servings").first().fill("3");
    await clickCentered(page.getByRole("button", { name: "Update" }).first());
    await expect(page.getByText("Serving count updated.")).toBeVisible();

    await clickCentered(page.getByRole("button", { name: "Remove" }).first());
    await expect(page.getByText("Open meal slot")).toHaveCount(1);
    await clickCentered(page.getByRole("button", { name: "Add meal" }));
    await expect(page.getByRole("button", { name: "Swap" })).toHaveCount(21);

    const storedPlan = await retryCloudRead<{
      budget_limit_minor: number;
      estimated_total_minor: number;
      meal_plan_items: Array<{ recipe_id: number }>;
    }>(() =>
      admin
        .from("meal_plans")
        .select("budget_limit_minor,estimated_total_minor,meal_plan_items(recipe_id)")
        .eq("user_id", userAId)
        .eq("week_start", "2026-08-10")
        .single(),
    );
    expect(storedPlan.meal_plan_items).toHaveLength(21);
    expect(storedPlan.estimated_total_minor).toBeLessThanOrEqual(
      storedPlan.budget_limit_minor,
    );

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("isolates private plans across signed-out, user A, user B, and privileged clients", async () => {
    const guest = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const guestRead = await guest.from("meal_plans").select("id");
    expect(guestRead.error).not.toBeNull();

    const userB = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const signedInB = await userB.auth.signInWithPassword({ email: userBEmail, password });
    if (signedInB.error) throw signedInB.error;
    let hiddenData: Array<{ id: number }> | null = null;
    await expect.poll(async () => {
      const hidden = await userB.from("meal_plans").select("id").eq("user_id", userAId);
      hiddenData = hidden.data;
      return hidden.error?.code ?? "ok";
    }, { intervals: [500, 1_000, 2_000] }).toBe("ok");
    expect(hiddenData).toEqual([]);
    const denied = await userB.from("meal_plans").insert({
      user_id: userAId,
      week_start: "2026-08-17",
      budget_limit_minor: 5_000_000,
      estimated_total_minor: 0,
    });
    expect(denied.error).not.toBeNull();

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const privileged = await admin
      .from("meal_plans")
      .select("id,user_id")
      .eq("user_id", userAId)
      .eq("week_start", "2026-08-10")
      .single();
    if (privileged.error || !privileged.data) throw privileged.error;
    expect(privileged.data.user_id).toBe(userAId);
  });
});
