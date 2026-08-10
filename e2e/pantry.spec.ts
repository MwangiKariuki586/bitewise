import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for hosted pantry tests.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = "BiteWise#Pantry2026";

test.describe("pantry inventory and isolation", () => {
  test.describe.configure({ mode: "serial" });
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const emailA = `pantry-a-${runId}@example.com`;
  const emailB = `pantry-b-${runId}@example.com`;
  let userAId = "";
  let userBId = "";

  test.beforeAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const [createdA, createdB] = await Promise.all([
      admin.auth.admin.createUser({ email: emailA, password, email_confirm: true }),
      admin.auth.admin.createUser({ email: emailB, password, email_confirm: true }),
    ]);
    if (createdA.error || createdB.error || !createdA.data.user || !createdB.data.user) throw new Error("Temporary pantry users could not be created.");
    userAId = createdA.data.user.id;
    userBId = createdB.data.user.id;

    const profiles = await admin.from("profiles").insert([
      { user_id: userAId, display_name: "Pantry A", budget_minor: 500000, onboarding_completed: true },
      { user_id: userBId, display_name: "Pantry B", budget_minor: 500000, onboarding_completed: true },
    ]);
    if (profiles.error) throw new Error("Temporary pantry profiles could not be created.");
  });

  test.afterAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    await Promise.all([userAId, userBId].filter(Boolean).map((id) => admin.auth.admin.deleteUser(id)));
  });

  test("a user can add, search, edit, and remove a pantry item", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(emailA);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);
    await page.goto("/my-kitchen");

    await page.getByLabel("Ingredient").selectOption({ label: "Tomato" });
    await page.getByLabel("Quantity").fill("4");
    await page.getByRole("button", { name: "Add to pantry" }).click();
    await expect(page.getByText("Added to your pantry.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tomato" })).toBeVisible();

    await page.getByPlaceholder("Search your pantry").fill("Tomato");
    await page.getByPlaceholder("Search your pantry").press("Enter");
    await expect(page.getByRole("heading", { name: "Tomato" })).toBeVisible();
    await page.getByRole("link", { name: "Edit Tomato" }).click();
    await expect(page.getByLabel("Ingredient").locator("option:checked")).toHaveText("Tomato");
    await page.getByLabel("Quantity").fill("6");
    await page.getByRole("button", { name: "Update pantry item" }).click();
    await expect(page.getByText("Pantry item updated.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tomato" })).toBeVisible();

    await page.getByRole("button", { name: "Delete Tomato" }).click();
    await expect(page.getByText("Your pantry is ready for its first item.")).toBeVisible();
  });

  test("a user can save, edit, and remove a leftover", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(emailA);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);
    await page.goto("/my-kitchen/leftovers");

    await page.getByLabel("Meal or dish").fill("Bean stew");
    await page.getByLabel("Servings left").fill("2");
    await page.getByLabel("Prepared").fill(today);
    await page.getByLabel("Use by").fill(today);
    await page.getByRole("button", { name: "Save leftover" }).click();
    await expect(page.getByText("Leftover saved.")).toBeVisible();
    await page.getByRole("link", { name: "Edit Bean stew" }).click();
    await page.getByLabel("Servings left").fill("1.5");
    await page.getByRole("button", { name: "Update leftover" }).click();
    await expect(page.getByText("Leftover updated.")).toBeVisible();
    await page.getByRole("button", { name: "Delete Bean stew" }).click();
    await expect(page.getByText("No leftovers to use up.")).toBeVisible();

    const recipeSelect = page.getByLabel(/BiteWise recipe/);
    await page.getByLabel("Meal or dish").fill("");
    await recipeSelect.selectOption({ index: 1 });
    const linkedRecipe = (await recipeSelect.locator("option:checked").textContent())?.trim();
    if (!linkedRecipe) throw new Error("A canonical leftover recipe was not available.");
    await page.getByLabel("Servings left").fill("2");
    await page.getByLabel("Prepared").fill(today);
    await page.getByLabel("Use by").fill(today);
    await page.getByRole("button", { name: "Save leftover" }).click();
    await expect(page.getByText(`Linked recipe: ${linkedRecipe}`)).toBeVisible();
    await page.getByRole("button", { name: `Delete ${linkedRecipe}` }).click();
    await expect(page.getByText("No leftovers to use up.")).toBeVisible();
  });

  test("live RLS blocks cross-user pantry access and mutation", async () => {
    const clientA = createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const clientB = createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
    await Promise.all([
      clientA.auth.signInWithPassword({ email: emailA, password }),
      clientB.auth.signInWithPassword({ email: emailB, password }),
    ]);
    const ingredient = await clientA.from("ingredients").select("id").eq("slug", "rice").single();
    expect(ingredient.error).toBeNull();
    const inserted = await clientA.from("pantry_items").insert({ user_id: userAId, ingredient_id: ingredient.data!.id, quantity: 500, unit: "g" }).select("id").single();
    expect(inserted.error).toBeNull();

    const hidden = await clientB.from("pantry_items").select("id").eq("id", inserted.data!.id);
    expect(hidden.data).toEqual([]);
    await clientB.from("pantry_items").update({ quantity: 1 }).eq("id", inserted.data!.id);
    const unchanged = await clientA.from("pantry_items").select("quantity").eq("id", inserted.data!.id).single();
    expect(unchanged.data?.quantity).toBe(500);

    const today = new Date().toISOString().slice(0, 10);
    const leftover = await clientA.from("leftovers").insert({ user_id: userAId, name: "RLS stew", servings: 2, prepared_date: today, expiry_date: today }).select("id").single();
    expect(leftover.error).toBeNull();
    const hiddenLeftover = await clientB.from("leftovers").select("id").eq("id", leftover.data!.id);
    expect(hiddenLeftover.data).toEqual([]);
    await clientB.from("leftovers").update({ servings: 99 }).eq("id", leftover.data!.id);
    const unchangedLeftover = await clientA.from("leftovers").select("servings").eq("id", leftover.data!.id).single();
    expect(unchangedLeftover.data?.servings).toBe(2);
  });
});
