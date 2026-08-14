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

function uniqueBaseline(
  candidates: CandidatesByMealType,
  avoidedRecipeIds: ReadonlySet<number>,
) {
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
    const available = [...candidates[slot.mealType]].sort((left, right) =>
      Number(avoidedRecipeIds.has(left.recipeId)) - Number(avoidedRecipeIds.has(right.recipeId)) ||
      byAffordableCost(left, right),
    );
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

function diverseAffordableBaseline(
  candidates: CandidatesByMealType,
  budgetLimitMinor: number,
  avoidedRecipeIds: ReadonlySet<number>,
) {
  const selection = duplicateBaseline(candidates);
  if (selection.some((candidate) => candidate === null)) return null;
  const complete = selection as PlanCandidate[];
  let totalMinor = totalCost(complete);
  if (totalMinor > budgetLimitMinor) return null;
  const usage = new Map<number, number>();
  for (const candidate of complete) {
    usage.set(candidate.recipeId, (usage.get(candidate.recipeId) ?? 0) + 1);
  }

  for (let index = 0; index < slots.length; index += 1) {
    const current = complete[index];
    usage.set(current.recipeId, (usage.get(current.recipeId) ?? 1) - 1);
    const replacement = candidates[slots[index].mealType]
      .filter((candidate) =>
        totalMinor - current.budgetedCostMinor + candidate.budgetedCostMinor <= budgetLimitMinor,
      )
      .sort((left, right) =>
        (usage.get(left.recipeId) ?? 0) - (usage.get(right.recipeId) ?? 0) ||
        Number(avoidedRecipeIds.has(left.recipeId)) - Number(avoidedRecipeIds.has(right.recipeId)) ||
        right.score - left.score ||
        byAffordableCost(left, right),
      )[0] ?? current;
    complete[index] = replacement;
    totalMinor = totalMinor - current.budgetedCostMinor + replacement.budgetedCostMinor;
    usage.set(replacement.recipeId, (usage.get(replacement.recipeId) ?? 0) + 1);
  }

  return { selection: complete, totalMinor };
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
  avoidedRecipeIds: ReadonlySet<number>,
) {
  let totalMinor = totalCost(selection);
  const usedIds = new Set(selection.map((candidate) => candidate.recipeId));

  for (let index = 0; index < slots.length; index += 1) {
    const current = selection[index];
    const ranked = [...candidates[slots[index].mealType]].sort((left, right) =>
      Number(avoidedRecipeIds.has(left.recipeId)) - Number(avoidedRecipeIds.has(right.recipeId)) ||
      right.score - left.score ||
      byAffordableCost(left, right),
    );
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
  avoidedRecipeIds: ReadonlySet<number> = new Set(),
): GeneratedPlan | null {
  if (mealTypes.some((mealType) => candidates[mealType].length === 0)) return null;

  const unique = uniqueBaseline(candidates, avoidedRecipeIds);
  let selection = unique;
  let usedDuplicates = false;
  if (!selection || totalCost(selection) > budgetLimitMinor) {
    const diversified = diverseAffordableBaseline(
      candidates,
      budgetLimitMinor,
      avoidedRecipeIds,
    );
    selection = diversified?.selection ?? null;
    usedDuplicates = true;
  }
  if (!selection || selection.some((candidate) => candidate === null)) return null;

  const completeSelection = selection as PlanCandidate[];
  if (totalCost(completeSelection) > budgetLimitMinor) return null;
  const upgraded = usedDuplicates
    ? { selection: completeSelection, totalMinor: totalCost(completeSelection) }
    : upgradeWithinBudget(
        completeSelection,
        candidates,
        budgetLimitMinor,
        avoidedRecipeIds,
      );

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
