import { describe, expect, it } from "vitest";

import { selectDiverseRecommendations } from "@/features/recommendations/diversity";
import type {
  RecommendationCandidate,
  RecommendedMeal,
} from "@/features/recommendations/ranking";

function candidate(
  id: number,
  cuisine: string,
  ingredientIds: number[],
): RecommendationCandidate {
  return {
    id,
    slug: `meal-${id}`,
    name: `Meal ${id}`,
    summary: "A practical meal.",
    cuisine,
    mealTypes: ["dinner"],
    baseServings: 4,
    totalMinutes: 30,
    difficulty: "easy",
    healthTags: [],
    ingredients: ingredientIds.map((ingredientId) => ({
      id: ingredientId,
      name: `Ingredient ${ingredientId}`,
      quantity: 1,
      unit: "piece",
      isOptional: false,
      estimatedCostMinor: 100,
      purchasePack: { quantity: 1, unit: "piece", priceMinor: 100 },
      alternatives: [],
    })),
    image: null,
    estimatedCostMinor: 100,
    affordableCostMinor: 100,
    usesSubstitution: false,
  };
}

function meal(id: number, score: number): RecommendedMeal {
  return {
    id,
    slug: `meal-${id}`,
    name: `Meal ${id}`,
    summary: "A practical meal.",
    cuisine: "kenyan",
    mealTypes: ["dinner"],
    servings: 4,
    totalMinutes: 30,
    difficulty: "easy",
    image: null,
    score,
    reasons: [],
    estimatedCostMinor: 100,
    affordableCostMinor: 100,
    cashNeededMinor: 100,
    estimatedCostPerServingMinor: 25,
    pantryCoveragePercent: 0,
    pantryIngredientNames: [],
    missingIngredients: [],
    substitutions: [],
  };
}

describe("recommendation shortlist diversity", () => {
  it("keeps the strongest meal first and promotes a distinct close match", () => {
    const candidates = [
      candidate(1, "kenyan", [1, 2, 3]),
      candidate(2, "kenyan", [1, 2, 3]),
      candidate(3, "coastal", [4, 5, 6]),
    ];
    const selected = selectDiverseRecommendations(
      [meal(1, 90), meal(2, 89), meal(3, 86)],
      candidates,
      3,
    );

    expect(selected.map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it("does not let diversity overcome a materially stronger score", () => {
    const candidates = [
      candidate(1, "kenyan", [1, 2]),
      candidate(2, "kenyan", [1, 2]),
      candidate(3, "coastal", [3, 4]),
    ];
    const selected = selectDiverseRecommendations(
      [meal(1, 90), meal(2, 89), meal(3, 60)],
      candidates,
      3,
    );

    expect(selected.map((item) => item.id)).toEqual([1, 2, 3]);
  });

  it("returns a bounded deterministic shortlist", () => {
    const candidates = [1, 2, 3].map((id) => candidate(id, "kenyan", [id]));
    expect(selectDiverseRecommendations(
      [meal(3, 70), meal(2, 70), meal(1, 70)],
      candidates,
      2,
    ).map((item) => item.id)).toEqual([1, 2]);
  });
});
