import { describe, expect, it } from "vitest";

import {
  basicsSchema,
  kitchenSchema,
  preferencesSchema,
} from "@/features/profile/schemas";

describe("profile validation", () => {
  it("accepts reasonable KES and household defaults", () => {
    const result = basicsSchema.parse({
      displayName: "Wanjiku",
      budgetPeriod: "weekly",
      budgetKes: "4500",
      householdSize: "4",
    });

    expect(result.budgetKes).toBe(4500);
    expect(result.householdSize).toBe(4);
  });

  it("rejects an unreasonable budget", () => {
    expect(
      basicsSchema.safeParse({
        displayName: "Wanjiku",
        budgetPeriod: "daily",
        budgetKes: "50",
        householdSize: "1",
      }).success,
    ).toBe(false);
  });

  it("rejects equipment values outside the canonical set", () => {
    expect(
      kitchenSchema.safeParse({
        availableMinutes: 30,
        equipment: ["gas_cooker", "campfire"],
      }).success,
    ).toBe(false);
  });

  it("treats dietary constraints and preferences as canonical arrays", () => {
    const result = preferencesSchema.safeParse({
      dietaryPreferences: ["halal", "dairy_free"],
      healthGoals: ["balanced_eating"],
      preferredCuisines: ["swahili_coast"],
      preferredDishes: ["Pilau", "Samaki wa kupaka"],
    });

    expect(result.success).toBe(true);
  });
});
