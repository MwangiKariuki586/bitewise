import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing page establishes the BiteWise journey", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("what should we eat?");
  const hero = page.locator('section[aria-labelledby="landing-title"]');
  await expect(hero.getByRole("link", { name: "Find my next meal" })).toBeVisible();
  const finalCta = page.locator('section[aria-labelledby="final-cta-title"]');
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const expectedBottomMargin = viewportWidth <= 760 ? "0px" : viewportWidth <= 1050 ? "24px" : "20px";
  await expect(finalCta).toHaveCSS("margin-bottom", expectedBottomMargin);

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
});

test("product shell keeps all five areas connected", async ({ page }) => {
  await page.goto("/discover");
  const navigation = page.getByRole("navigation", { name: "Main navigation" }).first();

  for (const label of ["Eat Now", "Meal Plan", "Discover", "Cook", "My Kitchen"]) {
    await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
});
