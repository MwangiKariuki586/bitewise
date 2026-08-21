import { describe, expect, it } from "vitest";

import {
  defaultMealBudgetMinor,
  recommendationEventInputSchema,
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
        budgetKes: "65",
        servings: "1",
        maxMinutes: "45",
        mealType: null,
        equipment: ["gas_cooker"],
        dietaryPreferences: [],
      }).success,
    ).toBe(true);
    expect(
      recommendationInputSchema.safeParse({
        budgetKes: "-5",
        servings: "0",
        maxMinutes: "999",
        mealType: "brunch",
        equipment: ["bonfire"],
        dietaryPreferences: [],
      }).success,
    ).toBe(false);
  });

  it("accepts bounded unique recommendation events", () => {
    const input = {
      runId: "10000000-0000-4000-8000-000000000001",
      eventType: "impression",
      recipeIds: [1, 2, 3],
    };

    expect(recommendationEventInputSchema.safeParse(input).success).toBe(true);
    expect(
      recommendationEventInputSchema.safeParse({ ...input, recipeIds: [1, 1] })
        .success,
    ).toBe(false);
    expect(
      recommendationEventInputSchema.safeParse({ ...input, eventType: "purchase" })
        .success,
    ).toBe(false);
  });
});
