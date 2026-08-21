import { recommendationScoringProfile } from "@/features/recommendations/config";
import type {
  RecommendationCandidate,
  RecommendedMeal,
} from "@/features/recommendations/ranking";

function jaccard(left: ReadonlySet<number | string>, right: ReadonlySet<number | string>) {
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let intersection = 0;
  left.forEach((value) => {
    if (right.has(value)) intersection += 1;
  });
  return intersection / union.size;
}

function candidateSimilarity(
  left: RecommendationCandidate,
  right: RecommendationCandidate,
) {
  const weights = recommendationScoringProfile.shortlist.similarityWeights;
  const leftIngredients = new Set(
    left.ingredients.filter((item) => !item.isOptional).map((item) => item.id),
  );
  const rightIngredients = new Set(
    right.ingredients.filter((item) => !item.isOptional).map((item) => item.id),
  );
  const ingredientSimilarity = jaccard(leftIngredients, rightIngredients);
  const cuisineSimilarity = left.cuisine === right.cuisine ? 1 : 0;
  const mealTypeSimilarity = jaccard(
    new Set(left.mealTypes),
    new Set(right.mealTypes),
  );
  return ingredientSimilarity * weights.ingredients +
    cuisineSimilarity * weights.cuisine +
    mealTypeSimilarity * weights.mealTypes;
}

function stableMealOrder(left: RecommendedMeal, right: RecommendedMeal) {
  return right.score - left.score ||
    left.cashNeededMinor - right.cashNeededMinor ||
    left.totalMinutes - right.totalMinutes ||
    left.name.localeCompare(right.name);
}

export function selectDiverseRecommendations(
  meals: RecommendedMeal[],
  candidates: RecommendationCandidate[],
  limit: number = recommendationScoringProfile.shortlist.size,
) {
  if (limit <= 0 || !meals.length) return [];
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const remaining = [...meals].sort(stableMealOrder);
  const selected: RecommendedMeal[] = [];

  while (selected.length < limit && remaining.length) {
    const nextIndex = remaining.reduce((bestIndex, meal, index) => {
      const candidate = candidateById.get(meal.id);
      const maximumSimilarity = candidate
        ? selected.reduce((maximum, selectedMeal) => {
            const selectedCandidate = candidateById.get(selectedMeal.id);
            return selectedCandidate
              ? Math.max(maximum, candidateSimilarity(candidate, selectedCandidate))
              : maximum;
          }, 0)
        : 0;
      const adjustedScore = meal.score -
        maximumSimilarity * recommendationScoringProfile.shortlist.maximumSimilarityPenalty;
      const bestMeal = remaining[bestIndex];
      const bestCandidate = candidateById.get(bestMeal.id);
      const bestMaximumSimilarity = bestCandidate
        ? selected.reduce((maximum, selectedMeal) => {
            const selectedCandidate = candidateById.get(selectedMeal.id);
            return selectedCandidate
              ? Math.max(maximum, candidateSimilarity(bestCandidate, selectedCandidate))
              : maximum;
          }, 0)
        : 0;
      const bestAdjustedScore = bestMeal.score -
        bestMaximumSimilarity * recommendationScoringProfile.shortlist.maximumSimilarityPenalty;
      if (adjustedScore !== bestAdjustedScore) {
        return adjustedScore > bestAdjustedScore ? index : bestIndex;
      }
      return stableMealOrder(meal, bestMeal) < 0 ? index : bestIndex;
    }, 0);
    selected.push(remaining.splice(nextIndex, 1)[0]);
  }

  return selected;
}
