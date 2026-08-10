import { describe, expect, it } from "vitest";

import {
  rankRecommendations,
  type RecommendationCandidate,
} from "@/features/recommendations/ranking";

function candidate(
  overrides: Partial<RecommendationCandidate> = {},
): RecommendationCandidate {
  return {
    id: 1,
    slug: "bean-rice",
    name: "Bean Rice",
    summary: "A practical bean and rice meal.",
    cuisine: "kenyan",
    mealTypes: ["lunch"],
    baseServings: 4,
    totalMinutes: 40,
    difficulty: "easy",
    healthTags: ["high_fibre"],
    ingredients: [
      {
        id: 10,
        name: "Beans",
        quantity: 400,
        unit: "g",
        isOptional: false,
        estimatedCostMinor: 20_000,
        alternatives: [
          {
            ingredient: { id: 11, name: "Green grams" },
            scaledQuantity: 300,
            alternativeUnit: "g",
            estimatedCostMinor: 15_000,
            note: "Use green grams when they cost less.",
          },
        ],
      },
    ],
    image: null,
    estimatedCostMinor: 30_000,
    affordableCostMinor: 25_000,
    usesSubstitution: true,
    ...overrides,
  };
}

const preferences = {
  budgetMinor: 50_000,
  servings: 4,
  maxMinutes: 60,
  preferredCuisines: ["kenyan"],
  preferredDishes: [],
  healthGoals: ["high_fibre"],
  today: "2026-08-06",
};

describe("deterministic recommendation ranking", () => {
  it("prioritises pantry coverage and ingredients expiring within three days", () => {
    const stocked = candidate();
    const unstocked = candidate({
      id: 2,
      slug: "other",
      name: "Other Meal",
      ingredients: [
        {
          id: 12,
          name: "Rice",
          quantity: 400,
          unit: "g",
          isOptional: false,
          estimatedCostMinor: 20_000,
          alternatives: [],
        },
      ],
    });

    const ranked = rankRecommendations(
      [unstocked, stocked],
      [
        {
          ingredientId: 10,
          quantity: 0.4,
          unit: "kg",
          expiryDate: "2026-08-08",
        },
      ],
      preferences,
    );

    expect(ranked[0].id).toBe(stocked.id);
    expect(ranked[0].pantryCoveragePercent).toBe(100);
    expect(ranked[0].reasons).toContain(
      "You already have 100% of the required ingredients.",
    );
    expect(ranked[0].reasons.some((reason) => reason.includes("due within 3 days"))).toBe(
      true,
    );
  });

  it("excludes expired inventory from coverage and lists missing quantities", () => {
    const [meal] = rankRecommendations(
      [candidate()],
      [
        {
          ingredientId: 10,
          quantity: 400,
          unit: "g",
          expiryDate: "2026-08-05",
        },
      ],
      preferences,
    );

    expect(meal.pantryCoveragePercent).toBe(0);
    expect(meal.missingIngredients).toEqual([
      { ingredientId: 10, name: "Beans", quantity: 400, unit: "g" },
    ]);
  });

  it("returns cheaper approved substitutions and deterministic tie-breaks", () => {
    const lowerCost = candidate({ id: 2, slug: "lower", name: "Z Meal" });
    const higherCost = candidate({
      id: 3,
      slug: "higher",
      name: "A Meal",
      estimatedCostMinor: 35_000,
      affordableCostMinor: 30_000,
    });
    const ranked = rankRecommendations([higherCost, lowerCost], [], preferences);

    expect(ranked[0].id).toBe(lowerCost.id);
    expect(ranked[0].substitutions[0]).toMatchObject({
      sourceIngredient: "Beans",
      alternativeIngredient: "Green grams",
      estimatedSavingMinor: 5_000,
    });
  });

  it("excludes disliked meals without changing the hard-constraint candidate set", () => {
    const disliked = candidate({ id: 1, name: "Disliked meal" });
    const available = candidate({ id: 2, name: "Available meal" });
    const ranked = rankRecommendations([disliked, available], [], {
      ...preferences,
      personalisation: new Map([
        [1, { feedback: "disliked", isSaved: false, lastEatenAt: null }],
      ]),
    });

    expect(ranked.map((meal) => meal.id)).toEqual([2]);
  });

  it("adds the documented like and favourite weights", () => {
    const neutral = rankRecommendations([candidate()], [], preferences)[0];
    const liked = rankRecommendations([candidate()], [], {
      ...preferences,
      personalisation: new Map([
        [1, { feedback: "liked", isSaved: false, lastEatenAt: null }],
      ]),
    })[0];
    const favourite = rankRecommendations([candidate()], [], {
      ...preferences,
      personalisation: new Map([
        [1, { feedback: null, isSaved: true, lastEatenAt: null }],
      ]),
    })[0];

    expect(liked.score - neutral.score).toBe(6);
    expect(liked.reasons).toContain("You liked this meal before.");
    expect(favourite.score - neutral.score).toBe(8);
    expect(favourite.reasons).toContain("Saved in My Kitchen as a favourite.");
  });

  it.each([
    ["2026-08-06T12:00:00Z", 20],
    ["2026-07-30T12:00:00Z", 20],
    ["2026-07-29T12:00:00Z", 10],
    ["2026-07-23T12:00:00Z", 10],
    ["2026-07-22T12:00:00Z", 0],
  ])("applies the recent-meal variety penalty at date boundaries", (lastEatenAt, penalty) => {
    const neutral = rankRecommendations([candidate()], [], preferences)[0];
    const personalised = rankRecommendations([candidate()], [], {
      ...preferences,
      personalisation: new Map([
        [1, { feedback: null, isSaved: false, lastEatenAt }],
      ]),
    })[0];

    expect(neutral.score - personalised.score).toBe(penalty);
    expect(
      personalised.reasons.some((reason) => reason.includes("lower for variety")),
    ).toBe(penalty > 0);
  });
});
