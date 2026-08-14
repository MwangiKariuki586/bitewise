import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for hosted profile tests.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const password = "BiteWise#Test2026";

test.describe("profile onboarding and isolation", () => {
  test.describe.configure({ mode: "serial" });

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const emailA = `bitewise-a-${runId}@example.com`;
  const emailB = `bitewise-b-${runId}@example.com`;
  let userAId = "";
  let userBId = "";

  test.beforeAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [resultA, resultB] = await Promise.all([
      admin.auth.admin.createUser({ email: emailA, password, email_confirm: true }),
      admin.auth.admin.createUser({ email: emailB, password, email_confirm: true }),
    ]);

    if (resultA.error || resultB.error || !resultA.data.user || !resultB.data.user) {
      throw new Error("Temporary hosted test users could not be created.");
    }
    userAId = resultA.data.user.id;
    userBId = resultB.data.user.id;
  });

  test.afterAll(async () => {
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await Promise.all(
      [userAId, userBId]
        .filter(Boolean)
        .map((userId) => admin.auth.admin.deleteUser(userId)),
    );
  });

  test("a new user completes resumable onboarding", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email address").fill(emailA);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByLabel("What should we call you?").fill("Wanjiku");
    await page.getByLabel("Budget period").selectOption("weekly");
    await page.getByLabel("Food budget (KES)").fill("4500");
    await page.getByLabel("People to serve").fill("4");
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL(/step=kitchen/);
    await page.getByLabel("Usual cooking time (minutes)").fill("40");
    await page.getByLabel("Gas cooker").check();
    await page.getByLabel("Refrigerator").check();
    await page.getByRole("button", { name: "Save and continue" }).click();

    await expect(page).toHaveURL(/step=preferences/);
    await page.getByLabel("Halal").check();
    await page.getByLabel("Balanced eating").check();
    await page.getByLabel("Swahili coast").check();
    await page.getByLabel("Favourite dishes").fill("Pilau, samaki wa kupaka");
    await page.getByRole("button", { name: "Finish setup" }).click();

    await expect(page).toHaveURL(/\/eat-now$/);
    await page.goto("/profile");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wanjiku");
    await expect(page.getByText("KES 4,500 / weekly")).toBeVisible();

    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/eat-now$/);
    await page.goto("/profile");

    const accountMenu = page.getByRole("button", {
      name: "Open account menu for Wanjiku",
    });
    await expect(accountMenu).toContainText("WA");
    await accountMenu.click();
    const accountCard = page.getByRole("region", { name: "Account menu" });
    await expect(accountCard).toBeVisible();
    const editPreferences = accountCard.getByRole("link", { name: "Edit preferences" });
    await expect(editPreferences).toHaveAttribute("href", "/profile/edit");
    await expect(accountCard.getByRole("link", { name: "Saved meals" })).toBeVisible();
    await expect(accountCard.getByRole("button", { name: "Sign out" })).toBeVisible();
    await editPreferences.click();
    await expect(page).toHaveURL(/\/profile\/edit$/);
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page).toHaveURL(/\/profile\/edit\?step=kitchen/);
  });

  test("live RLS hides profiles across users", async () => {
    const userA = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const userB = createClient(supabaseUrl, publishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const [sessionA, sessionB] = await Promise.all([
      userA.auth.signInWithPassword({ email: emailA, password }),
      userB.auth.signInWithPassword({ email: emailB, password }),
    ]);
    expect(sessionA.error).toBeNull();
    expect(sessionB.error).toBeNull();

    const ownInsert = await userB.from("profiles").insert({
      user_id: userBId,
      display_name: "Test User B",
    });
    expect(ownInsert.error).toBeNull();

    const [aReadsB, bReadsA] = await Promise.all([
      userA.from("profiles").select("user_id").eq("user_id", userBId),
      userB.from("profiles").select("user_id").eq("user_id", userAId),
    ]);
    expect(aReadsB.error).toBeNull();
    expect(aReadsB.data).toEqual([]);
    expect(bReadsA.error).toBeNull();
    expect(bReadsA.data).toEqual([]);
  });
});
