import { expect, test } from "@playwright/test";

test("Watch & Cook builds a transparent external tutorial search", async ({ page }) => {
  await page.goto("/recipes/chapati-bean-stew");

  await expect(page.getByRole("heading", { name: "Find a tutorial that fits your kitchen." })).toBeVisible();
  await page.getByLabel("Tutorial language").selectOption("swahili");
  await page.getByLabel("Maximum video time").selectOption("30");
  await page.getByLabel("Skill level").selectOption("easy");
  await page.getByLabel("Equipment").selectOption("gas_cooker");
  await page.getByLabel("Vegan").check();

  const tutorialLink = page.getByRole("link", { name: /search youtube tutorials/i });
  await expect(tutorialLink).toHaveAttribute("target", "_blank");
  const href = await tutorialLink.getAttribute("href");
  const url = new URL(href ?? "");
  const query = url.searchParams.get("search_query") ?? "";

  expect(url.origin).toBe("https://www.youtube.com");
  expect(query).toContain("Chapati with Bean Stew recipe tutorial");
  expect(query).toContain("Kiswahili 30 minutes or less easy cooking");
  expect(query).toContain("using gas cooker");
  expect(query).toContain("vegan");
  await expect(page.getByText(/has not reviewed or endorsed individual videos/i)).toBeVisible();
});
