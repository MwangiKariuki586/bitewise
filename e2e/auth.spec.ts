import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("personalized routes require authentication", async ({ page }) => {
  await page.goto("/eat-now");

  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Good to have you back",
  );
});

test("registration exposes accessible validation feedback", async ({ page }) => {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Your name").fill("Amina");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByRole("button", { name: "Create my account" }).click();

  await expect(page.getByText("Check the highlighted fields.")).toBeVisible();
  await expect(page.locator("#email-error")).toBeVisible();
  await expect(page.locator("#password-error")).toBeVisible();
  await expect(page.locator("#confirm-password-error")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveValue("Amina");
  await expect(page.getByLabel("Email address")).toHaveValue("not-an-email");

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("sign-in passwords can be revealed without confirmation", async ({ page }) => {
  await page.goto("/auth/sign-in");

  const password = page.getByLabel("Password", { exact: true });
  await password.fill("Secret#42");
  await expect(page.getByLabel("Confirm password", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
});

test("password recovery uses neutral account messaging", async ({ page }) => {
  await page.goto("/auth/forgot-password");

  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
});

test("users can recover an unconfirmed signup", async ({ page }) => {
  await page.goto("/auth/sign-up");
  await expect(page.getByRole("link", { name: "Resend the email" })).toBeVisible();
  await page.getByRole("link", { name: "Resend the email" }).click();

  await expect(page).toHaveURL(/\/auth\/resend-confirmation$/);
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resend confirmation" }),
  ).toBeVisible();
});
