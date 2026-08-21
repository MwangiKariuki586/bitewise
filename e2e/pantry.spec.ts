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

  test("a user can add, filter, search, edit, and remove a pantry item", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(emailA);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);
    await page.goto("/my-kitchen");

    await page.getByRole("button", { name: "Add ingredient" }).click();
    const ingredientDialog = page.getByRole("dialog", { name: "What’s in your kitchen?" });
    await expect(ingredientDialog).toBeVisible();
    const dialogBox = await ingredientDialog.boundingBox();
    const viewport = page.viewportSize();
    expect(dialogBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (testInfo.project.name === "mobile-chromium") {
      expect(dialogBox!.width).toBeGreaterThanOrEqual(viewport!.width - 2);
    } else {
      expect(dialogBox!.width).toBeLessThan(viewport!.width / 2);
      expect(dialogBox!.x + dialogBox!.width).toBeGreaterThanOrEqual(viewport!.width - 2);
    }
    await ingredientDialog.getByLabel("Ingredient", { exact: true }).selectOption({ label: "Tomato" });
    const quantityInput = page.getByLabel("Quantity");
    await expect(quantityInput).toHaveAttribute("required", "");
    await expect(quantityInput).toHaveAttribute("min", "0.001");
    expect(await quantityInput.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
    await quantityInput.fill("4");
    const soonExpiry = new Date();
    soonExpiry.setUTCDate(soonExpiry.getUTCDate() + 2);
    const expiryDateInput = page.getByLabel(/Expiry date/);
    await expiryDateInput.evaluate((input: HTMLInputElement) => {
      input.showPicker = () => { input.dataset.calendarOpened = "true"; };
    });
    await expiryDateInput.click();
    await expect(expiryDateInput).toHaveAttribute("data-calendar-opened", "true");
    await expiryDateInput.fill(soonExpiry.toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Add to pantry" }).click();
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Added to your pantry." }).last()).toBeVisible();
    await expect(page.locator("main").getByText("Added to your pantry.", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "All ingredients" }).getByRole("heading", { name: "Tomato" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Use soon" }).getByRole("heading", { name: "Tomato" })).toBeVisible();
    const attentionAlert = page.getByRole("link", { name: "1 item needs attention this week" });
    await expect(attentionAlert).toHaveAttribute("href", "/my-kitchen?status=use-soon");
    await expect(page.getByText(/0 items have no expiry date/)).toHaveCount(0);
    await attentionAlert.click();
    await expect(page).toHaveURL(/\/my-kitchen\?status=use-soon$/);
    await expect(page.getByRole("button", { name: /Filter.*1/ })).toBeVisible();
    await page.goto("/my-kitchen");

    await page.getByRole("button", { name: "Add ingredient" }).click();
    await page.getByRole("dialog", { name: "What’s in your kitchen?" }).getByLabel("Ingredient", { exact: true }).selectOption({ label: "Garlic" });
    await page.getByLabel("Quantity").fill("1");
    await page.getByRole("button", { name: "Add to pantry" }).click();
    const noExpiryAlert = page.getByRole("link", { name: "1 item has no expiry date" });
    await expect(noExpiryAlert).toHaveAttribute("href", "/my-kitchen?status=no-expiry");
    await noExpiryAlert.click();
    await expect(page).toHaveURL(/\/my-kitchen\?status=no-expiry$/);
    await expect(page.getByRole("region", { name: "All ingredients" }).getByRole("heading", { name: "Garlic" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Filter.*1/ })).toBeVisible();
    await page.goto("/my-kitchen");

    await page.getByRole("button", { name: /^Filter/ }).click();
    const filters = page.getByRole("dialog", { name: "Filters" });
    const expiryFilter = filters.locator('select[name="expiry"]');
    await expiryFilter.selectOption("7-days");
    await filters.getByRole("radio", { name: "No expiry", exact: true }).check({ force: true });
    await expect(expiryFilter).toBeDisabled();
    await expect(expiryFilter).toHaveValue("no-expiry");
    await expect(filters.getByText("No expiry shows items without an expiry date.")).toBeVisible();
    await filters.getByRole("radio", { name: "All", exact: true }).check({ force: true });
    await expect(expiryFilter).toBeEnabled();
    await expect(expiryFilter).toHaveValue("");
    await filters.getByRole("radio", { name: "Use soon", exact: true }).check({ force: true });
    await expect(expiryFilter).toBeDisabled();
    await expect(expiryFilter).toHaveValue("7-days");
    await expect(filters.getByText("Use soon includes items expiring today through the next 7 days.")).toBeVisible();
    await filters.getByRole("radio", { name: "All", exact: true }).check({ force: true });
    await expect(expiryFilter).toBeEnabled();
    await expiryFilter.selectOption("7-days");
    await filters.getByLabel("Category").selectOption("dairy");
    await filters.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByRole("button", { name: /Filter.*2/ })).toBeVisible();
    await expect(page.getByText("Nothing matches these pantry controls.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Use soon" })).toHaveCount(0);
    await expect(page.getByText(/items? need attention this week/)).toHaveCount(0);
    await page.getByRole("button", { name: /Filter.*2/ }).click();
    await page.getByRole("dialog", { name: "Filters" }).getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/my-kitchen$/);

    await page.getByPlaceholder("Search your pantry").fill("Tomato");
    await page.getByPlaceholder("Search your pantry").press("Enter");
    await expect(page.getByRole("region", { name: "All ingredients" }).getByRole("heading", { name: "Tomato" })).toBeVisible();
    await page.getByRole("link", { name: "Edit Tomato" }).first().click();
    await expect(page.getByRole("dialog", { name: "Keep it accurate" })).toBeVisible();
    await expect(page.getByLabel("Ingredient", { exact: true }).locator("option:checked")).toHaveText("Tomato");
    await page.getByLabel("Quantity").fill("6");
    await page.getByRole("button", { name: "Update pantry item" }).click();
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Pantry item updated." }).last()).toBeVisible();
    await expect(page.locator("main").getByText("Pantry item updated.", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "All ingredients" }).getByRole("heading", { name: "Tomato" })).toBeVisible();

    await page.getByRole("region", { name: "All ingredients" }).getByRole("button", { name: "Delete Tomato" }).click();
    await expect(page.getByText("Nothing matches these pantry controls.")).toBeVisible();
  });

  test("same-ingredient batches are grouped and zero quantities stay opt-in", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(emailA);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/eat-now$/);
    await page.goto("/my-kitchen");

    for (const [quantity, expiry] of [["2", "2026-11-01"], ["1", "2026-12-01"]] as const) {
      await page.getByRole("button", { name: "Add ingredient" }).click();
      await page.getByRole("dialog", { name: "What’s in your kitchen?" }).getByLabel("Ingredient", { exact: true }).selectOption({ label: "Avocado" });
      await page.getByLabel("Quantity").fill(quantity);
      await page.getByLabel(/Expiry date/).fill(expiry);
      await page.getByRole("button", { name: "Add to pantry" }).click();
      await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Added to your pantry." }).last()).toBeVisible();
    }
    await expect(page.getByText("2 batches")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Avocado" })).toHaveCount(1);

    await page.getByRole("link", { name: "Edit Avocado" }).first().click();
    await page.getByLabel("Quantity").fill("0");
    await page.getByRole("button", { name: "Update pantry item" }).click();
    await page.getByRole("button", { name: /^Filter/ }).click();
    await page.getByRole("dialog", { name: "Filters" }).getByText("Show zero quantity").click();
    await page.getByRole("dialog", { name: "Filters" }).getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByText("Out of stock")).toBeVisible();

  });

  test("a user can save, edit, and remove a leftover", async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(emailA);
    await page.getByLabel("Password", { exact: true }).fill(password);
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
