import { describe, expect, it } from "vitest";

import {
  generateDeterministicWeeklyPlan,
  type CandidatesByMealType,
  type PlanCandidate,
} from "@/features/meal-plan/generator";
import type { MealType } from "@/features/meal-plan/schemas";

function candidate(recipeId: number, cost: number, score = 50): PlanCandidate {
  return {
    recipeId,
    name: `Recipe ${recipeId}`,
    score,
    budgetedCostMinor: cost,
    estimatedCostMinor: cost + 50,
    totalMinutes: 30,
  };
}

function candidatesFor(
  offsets: Record<MealType, number>,
  costs: number[],
): CandidatesByMealType {
  return {
    breakfast: costs.map((cost, index) => candidate(offsets.breakfast + index, cost, 100 - index)),
    lunch: costs.map((cost, index) => candidate(offsets.lunch + index, cost, 100 - index)),
    dinner: costs.map((cost, index) => candidate(offsets.dinner + index, cost, 100 - index)),
  };
}

describe("deterministic weekly plan generation", () => {
  it("fills all 21 slots, stays within budget, and avoids repeats when enough meals exist", () => {
    const candidates = candidatesFor(
      { breakfast: 1, lunch: 101, dinner: 201 },
      [100, 110, 120, 130, 140, 150, 160, 500],
    );
    const first = generateDeterministicWeeklyPlan(candidates, 4, 10_000);
    const second = generateDeterministicWeeklyPlan(candidates, 4, 10_000);

    expect(first).not.toBeNull();
    expect(first?.items).toHaveLength(21);
    expect(new Set(first?.items.map((item) => item.recipe_id))).toHaveLength(21);
    expect(first?.totalMinor).toBeLessThanOrEqual(10_000);
    expect(first?.usedDuplicates).toBe(false);
    expect(second).toEqual(first);
  });

  it("uses the cheapest repeat only when a unique set cannot fit the ceiling", () => {
    const candidates = candidatesFor(
      { breakfast: 1, lunch: 101, dinner: 201 },
      [100, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000],
    );
    const plan = generateDeterministicWeeklyPlan(candidates, 2, 2_100);

    expect(plan?.usedDuplicates).toBe(true);
    expect(plan?.totalMinor).toBe(2_100);
    expect(new Set(plan?.items.map((item) => item.recipe_id))).toHaveLength(3);
  });

  it("returns no plan when even the cheapest full week is over budget", () => {
    const candidates = candidatesFor(
      { breakfast: 1, lunch: 101, dinner: 201 },
      [100, 1_000, 1_000, 1_000, 1_000, 1_000, 1_000],
    );
    expect(generateDeterministicWeeklyPlan(candidates, 2, 2_099)).toBeNull();
  });
});
