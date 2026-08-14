import { describe, expect, it } from "vitest";

import {
  addRecipeToPlanSchema,
  generatePlanSchema,
  planMutationSchema,
  weekStartSchema,
} from "@/features/meal-plan/schemas";

describe("meal plan validation", () => {
  it("accepts ISO Mondays and rejects other week starts", () => {
    expect(weekStartSchema.safeParse("2026-08-10").success).toBe(true);
    expect(weekStartSchema.safeParse("2026-08-11").success).toBe(false);
    expect(generatePlanSchema.safeParse({ weekStart: "not-a-date" }).success).toBe(false);
  });

  it("requires operation-specific values", () => {
    const base = {
      weekStart: "2026-08-10",
      dayOfWeek: "2",
      mealType: "lunch",
    };
    expect(planMutationSchema.safeParse({ ...base, operation: "remove" }).success).toBe(true);
    expect(planMutationSchema.safeParse({ ...base, operation: "select" }).success).toBe(false);
    expect(planMutationSchema.safeParse({
      ...base,
      operation: "select",
      recipeId: "12",
      servings: "4",
    }).success).toBe(true);
    expect(planMutationSchema.safeParse({ ...base, operation: "set_servings" }).success).toBe(false);
  });

  it("validates direct recipe placement and replacement intent", () => {
    expect(addRecipeToPlanSchema.safeParse({
      weekStart: "2026-08-10",
      dayOfWeek: 2,
      mealType: "lunch",
      recipeId: 12,
      servings: 4,
      expectedRecipeId: null,
      replaceConfirmed: false,
    }).success).toBe(true);
    expect(addRecipeToPlanSchema.safeParse({
      weekStart: "2026-08-11",
      dayOfWeek: 9,
      mealType: "snack",
      recipeId: -1,
      servings: 0,
      expectedRecipeId: null,
      replaceConfirmed: false,
    }).success).toBe(false);
  });
});
