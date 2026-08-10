import { describe, expect, it } from "vitest";

import {
  defaultMealBudgetMinor,
  recommendationInputSchema,
} from "@/features/recommendations/schemas";

describe("recommendation input", () => {
  it("defaults daily and weekly budgets to one meal", () => {
    expect(defaultMealBudgetMinor(90_000, "daily")).toBe(30_000);
    expect(defaultMealBudgetMinor(630_000, "weekly")).toBe(30_000);
    expect(defaultMealBudgetMinor(null, "daily")).toBe(10_000);
  });

  it("accepts canonical overrides and rejects unsafe bounds", () => {
    expect(
      recommendationInputSchema.safeParse({
        budgetKes: "500",
        servings: "4",
        maxMinutes: "45",
        mealType: "dinner",
        equipment: ["gas_cooker"],
        dietaryPreferences: ["halal"],
      }).success,
    ).toBe(true);
    expect(
      recommendationInputSchema.safeParse({
        budgetKes: "10",
        servings: "0",
        maxMinutes: "999",
        mealType: "brunch",
        equipment: ["bonfire"],
        dietaryPreferences: [],
      }).success,
    ).toBe(false);
  });
});
