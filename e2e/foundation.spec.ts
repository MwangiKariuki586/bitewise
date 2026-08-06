import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing page establishes the BiteWise journey", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("what should we eat?");
  await expect(page.getByRole("link", { name: "Find my next meal" })).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

test("product shell keeps all five areas connected", async ({ page }) => {
  await page.goto("/discover");
  const navigation = page.getByRole("navigation", { name: "Main navigation" }).first();

  for (const label of ["Eat Now", "Meal Plan", "Discover", "Cook", "My Kitchen"]) {
    await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  }
});
