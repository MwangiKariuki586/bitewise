import type { RecommendedMeal } from "@/features/recommendations/ranking";
import { mealTypes, type MealType, type PlanRpcItem } from "@/features/meal-plan/schemas";

export interface PlanCandidate {
  recipeId: number;
  name: string;
  score: number;
  budgetedCostMinor: number;
  estimatedCostMinor: number;
  totalMinutes: number;
}

export type CandidatesByMealType = Record<MealType, PlanCandidate[]>;

export interface GeneratedPlan {
  items: PlanRpcItem[];
  totalMinor: number;
  usedDuplicates: boolean;
}

interface Slot {
  dayOfWeek: number;
  mealType: MealType;
}

const slots: Slot[] = Array.from({ length: 7 }, (_, dayOfWeek) =>
  mealTypes.map((mealType) => ({ dayOfWeek, mealType })),
).flat();

function byAffordableCost(left: PlanCandidate, right: PlanCandidate) {
  return left.budgetedCostMinor - right.budgetedCostMinor ||
    left.totalMinutes - right.totalMinutes ||
    left.name.localeCompare(right.name, "en-KE");
}

function uniqueBaseline(candidates: CandidatesByMealType) {
  const assigned = new Map<number, number>();
  const slotCandidate = new Map<number, PlanCandidate>();
  const orderedSlots = slots
    .map((slot, index) => ({ slot, index }))
    .sort((left, right) =>
      candidates[left.slot.mealType].length - candidates[right.slot.mealType].length ||
      left.index - right.index,
    );

  function assign(slotIndex: number, seen: Set<number>): boolean {
    const slot = slots[slotIndex];
    const available = [...candidates[slot.mealType]].sort(byAffordableCost);
    for (const candidate of available) {
      if (seen.has(candidate.recipeId)) continue;
      seen.add(candidate.recipeId);
      const previousSlot = assigned.get(candidate.recipeId);
      if (previousSlot === undefined || assign(previousSlot, seen)) {
        assigned.set(candidate.recipeId, slotIndex);
        slotCandidate.set(slotIndex, candidate);
        return true;
      }
    }
    return false;
  }

  for (const { index } of orderedSlots) {
    if (!assign(index, new Set())) return null;
  }
  return slots.map((_, index) => slotCandidate.get(index) ?? null);
}

function duplicateBaseline(candidates: CandidatesByMealType) {
  return slots.map((slot) =>
    [...candidates[slot.mealType]].sort(byAffordableCost)[0] ?? null,
  );
}

function totalCost(selection: Array<PlanCandidate | null>) {
  return selection.reduce(
    (total, candidate) => total + (candidate?.budgetedCostMinor ?? 0),
    0,
  );
}

function upgradeWithinBudget(
  selection: PlanCandidate[],
  candidates: CandidatesByMealType,
  budgetLimitMinor: number,
) {
  let totalMinor = totalCost(selection);
  const usedIds = new Set(selection.map((candidate) => candidate.recipeId));

  for (let index = 0; index < slots.length; index += 1) {
    const current = selection[index];
    const ranked = candidates[slots[index].mealType];
    const replacement = ranked.find((candidate) => {
      if (candidate.recipeId === current.recipeId) return true;
      if (usedIds.has(candidate.recipeId)) return false;
      return totalMinor - current.budgetedCostMinor + candidate.budgetedCostMinor <= budgetLimitMinor;
    });
    if (!replacement || replacement.recipeId === current.recipeId) continue;
    usedIds.delete(current.recipeId);
    usedIds.add(replacement.recipeId);
    totalMinor = totalMinor - current.budgetedCostMinor + replacement.budgetedCostMinor;
    selection[index] = replacement;
  }
  return { selection, totalMinor };
}

export function toPlanCandidate(meal: RecommendedMeal): PlanCandidate {
  return {
    recipeId: meal.id,
    name: meal.name,
    score: meal.score,
    budgetedCostMinor: meal.affordableCostMinor,
    estimatedCostMinor: meal.estimatedCostMinor,
    totalMinutes: meal.totalMinutes,
  };
}

export function generateDeterministicWeeklyPlan(
  candidates: CandidatesByMealType,
  servings: number,
  budgetLimitMinor: number,
): GeneratedPlan | null {
  if (mealTypes.some((mealType) => candidates[mealType].length === 0)) return null;

  const unique = uniqueBaseline(candidates);
  let selection = unique;
  let usedDuplicates = false;
  if (!selection || totalCost(selection) > budgetLimitMinor) {
    selection = duplicateBaseline(candidates);
    usedDuplicates = true;
  }
  if (selection.some((candidate) => candidate === null)) return null;

  const completeSelection = selection as PlanCandidate[];
  if (totalCost(completeSelection) > budgetLimitMinor) return null;
  const upgraded = usedDuplicates
    ? { selection: completeSelection, totalMinor: totalCost(completeSelection) }
    : upgradeWithinBudget(completeSelection, candidates, budgetLimitMinor);

  return {
    totalMinor: upgraded.totalMinor,
    usedDuplicates,
    items: slots.map((slot, index) => ({
      day_of_week: slot.dayOfWeek,
      meal_type: slot.mealType,
      recipe_id: upgraded.selection[index].recipeId,
      servings,
    })),
  };
}
