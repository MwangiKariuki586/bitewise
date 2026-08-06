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
  await page.getByRole("button", { name: "Create my account" }).click();

  await expect(page.getByText("Check the highlighted fields.")).toBeVisible();
  await expect(page.locator("#name-error")).toBeVisible();
  await expect(page.locator("#email-error")).toBeVisible();
  await expect(page.locator("#password-error")).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("password recovery uses neutral account messaging", async ({ page }) => {
  await page.goto("/auth/forgot-password");

  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to sign in" })).toBeVisible();
});
