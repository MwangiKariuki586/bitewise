import { describe, expect, it } from "vitest";

import {
  estimateCostPerServingMinor,
  estimateRecipeCostMinor,
} from "@/features/recipes/costs";

describe("recipe cost estimates", () => {
  const costs = [
    { ingredientId: 1, quantity: 2_000, priceMinor: 18_000 },
    { ingredientId: 2, quantity: 1, priceMinor: 3_000 },
  ];

  it("prorates reference prices and rounds the total to a whole minor unit", () => {
    expect(
      estimateRecipeCostMinor(
        [
          { ingredientId: 1, quantity: 400, isOptional: false },
          { ingredientId: 2, quantity: 2, isOptional: false },
        ],
        costs,
      ),
    ).toBe(9_600);
  });

  it("excludes optional ingredients unless they are requested", () => {
    const ingredients = [
      { ingredientId: 1, quantity: 400, isOptional: false },
      { ingredientId: 2, quantity: 1, isOptional: true },
    ];

    expect(estimateRecipeCostMinor(ingredients, costs)).toBe(3_600);
    expect(estimateRecipeCostMinor(ingredients, costs, true)).toBe(6_600);
  });

  it("returns null when a required price reference is unavailable", () => {
    expect(
      estimateRecipeCostMinor(
        [{ ingredientId: 3, quantity: 100, isOptional: false }],
        costs,
      ),
    ).toBeNull();
  });

  it("calculates a rounded-up per-serving estimate", () => {
    expect(estimateCostPerServingMinor(9_601, 4)).toBe(2_401);
    expect(estimateCostPerServingMinor(null, 4)).toBeNull();
    expect(estimateCostPerServingMinor(9_601, 0)).toBeNull();
  });
});
