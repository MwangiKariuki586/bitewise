import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("public recipe discovery", () => {
  test("a signed-out visitor searches and opens a complete public recipe", async ({ page }) => {
    await page.goto("/discover");

    await expect(page.getByRole("heading", { name: "Find a meal that fits the kitchen you have." })).toBeVisible();
    await page.getByLabel("Search recipes").fill("chapati");
    await page.getByLabel("Search recipes").press("Enter");

    await expect(page).toHaveURL(/\/discover\?q=chapati/);
    const firstRecipe = page.locator('a[href^="/recipes/"]').filter({ hasText: /chapati/i }).first();
    await expect(firstRecipe).toBeVisible();
    await firstRecipe.click();

    await expect(page).toHaveURL(/\/recipes\//);
    await expect(page.getByRole("button", { name: "Ingredients" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Preparation" })).toBeVisible();
    await expect(page.getByText(/why bitewise recommended this/i)).toBeVisible();

    const servingCount = page.getByText("4", { exact: true }).last();
    await page.getByRole("button", { name: "Increase servings" }).click();
    await expect(page.getByText("Serves 5")).toBeVisible();
    await expect(servingCount).toHaveText("5");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("local ingredient filtering works publicly while planning stays protected", async ({ page }) => {
    await page.goto("/discover?ingredient=sukuma");

    const localRecipe = page.locator('a[href="/recipes/ugali-sukuma-wiki"]');
    await expect(localRecipe).toBeVisible();
    await localRecipe.click();
    await page.getByRole("link", { name: "Open Meal Plan" }).click();

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("unknown public recipes use the shared not-found state", async ({ page }) => {
    await page.goto("/recipes/this-recipe-does-not-exist");

    await expect(page.getByRole("heading", { name: "This plate is empty." })).toBeVisible();
  });
});
