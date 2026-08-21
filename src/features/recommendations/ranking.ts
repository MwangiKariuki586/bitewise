import { purchaseCostForQuantity } from "@/features/recommendations/affordability";
import { recommendationScoringProfile } from "@/features/recommendations/config";
import { recommendationPreferenceMatch } from "@/features/recommendations/preferences";
import {
  datePlusDays,
  daysSince,
  quantityInUnit,
} from "@/features/recommendations/quantities";

export interface RecommendationIngredientAlternative {
  ingredient: { id: number; name: string };
  scaledQuantity: number;
  alternativeUnit: string;
  estimatedCostMinor: number | null;
  purchasePack: RecommendationPurchasePack | null;
  note: string;
}

export interface RecommendationPurchasePack {
  quantity: number;
  unit: string;
  priceMinor: number;
}

export interface RecommendationIngredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  estimatedCostMinor: number | null;
  purchasePack: RecommendationPurchasePack | null;
  alternatives: RecommendationIngredientAlternative[];
}

export interface RecommendationCandidate {
  id: number;
  slug: string;
  name: string;
  summary: string;
  cuisine: string;
  mealTypes: string[];
  baseServings: number;
  totalMinutes: number;
  difficulty: string;
  healthTags: string[];
  ingredients: RecommendationIngredient[];
  image: {
    path: string;
    alt: string;
    attributionName: string;
    attributionUrl: string;
    licenseName: string;
    licenseUrl: string;
  } | null;
  estimatedCostMinor: number;
  affordableCostMinor: number;
  usesSubstitution: boolean;
}

export interface RecommendationPantryItem {
  ingredientId: number;
  quantity: number;
  unit: string;
  expiryDate: string | null;
}

export interface RecommendationPreferences {
  budgetMinor: number;
  servings: number;
  maxMinutes: number;
  preferredCuisines: string[];
  preferredDishes: string[];
  healthGoals: string[];
  today: string;
  personalisation?: ReadonlyMap<number, RecommendationPersonalisationSignal>;
  affordabilityMode?: "ingredient-value" | "purchase-cost";
}

export interface RecommendationPersonalisationSignal {
  feedback: "liked" | "disliked" | null;
  isSaved: boolean;
  lastEatenAt: string | null;
}

export interface RecommendationMissingIngredient {
  ingredientId: number;
  name: string;
  quantity: number;
  unit: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  purchaseCostMinor: number;
}

export interface RecommendationSubstitution {
  sourceIngredient: string;
  alternativeIngredient: string;
  quantity: number;
  unit: string;
  estimatedSavingMinor: number;
  note: string;
}

export interface RecommendedMeal {
  id: number;
  slug: string;
  name: string;
  summary: string;
  cuisine: string;
  mealTypes: string[];
  servings: number;
  totalMinutes: number;
  difficulty: string;
  image: RecommendationCandidate["image"];
  score: number;
  reasons: string[];
  estimatedCostMinor: number;
  affordableCostMinor: number;
  cashNeededMinor: number;
  estimatedCostPerServingMinor: number;
  pantryCoveragePercent: number;
  pantryIngredientNames: string[];
  missingIngredients: RecommendationMissingIngredient[];
  substitutions: RecommendationSubstitution[];
}

export function rankRecommendations(
  candidates: RecommendationCandidate[],
  pantryItems: RecommendationPantryItem[],
  preferences: RecommendationPreferences,
) {
  const soonCutoff = datePlusDays(preferences.today, 3);
  const usablePantry = pantryItems.filter(
    (item) => !item.expiryDate || item.expiryDate >= preferences.today,
  );

  const ranked = candidates
    .filter(
      (candidate) =>
        preferences.personalisation?.get(candidate.id)?.feedback !== "disliked",
    )
    .map((candidate): RecommendedMeal => {
    const scale = preferences.servings / candidate.baseServings;
    const requiredIngredients = candidate.ingredients.filter(
      (ingredient) => !ingredient.isOptional,
    );
    let coverageTotal = 0;
    let expiringTotal = 0;
    const pantryIngredientNames: string[] = [];
    const missingIngredients: RecommendationMissingIngredient[] = [];
    let cashNeededMinor = 0;
    let hasCompletePurchasePricing = true;

    for (const ingredient of requiredIngredients) {
      const requiredQuantity = ingredient.quantity * scale;
      const matching = usablePantry.filter(
        (item) => item.ingredientId === ingredient.id,
      );
      const availableQuantity = matching.reduce(
        (total, item) =>
          total + quantityInUnit(item.quantity, item.unit, ingredient.unit),
        0,
      );
      const coverage = Math.min(1, availableQuantity / requiredQuantity);
      coverageTotal += coverage;
      if (coverage > 0) pantryIngredientNames.push(ingredient.name);
      if (coverage < 1) {
        const missingQuantity = Number((requiredQuantity - availableQuantity).toFixed(2));
        const purchase = purchaseCostForQuantity(
          missingQuantity,
          ingredient.unit,
          ingredient.purchasePack,
        );

        if (purchase) cashNeededMinor += purchase.costMinor;
        else hasCompletePurchasePricing = false;
        missingIngredients.push({
          ingredientId: ingredient.id,
          name: ingredient.name,
          quantity: missingQuantity,
          unit: ingredient.unit,
          purchaseQuantity: purchase?.quantity ?? missingQuantity,
          purchaseUnit: purchase?.unit ?? ingredient.unit,
          purchaseCostMinor: purchase?.costMinor ?? 0,
        });
      }

      const expiringQuantity = matching
        .filter(
          (item) =>
            item.expiryDate &&
            item.expiryDate >= preferences.today &&
            item.expiryDate <= soonCutoff,
        )
        .reduce(
          (total, item) =>
            total + quantityInUnit(item.quantity, item.unit, ingredient.unit),
          0,
        );
      expiringTotal += Math.min(1, expiringQuantity / requiredQuantity);
    }

    const ingredientCount = Math.max(1, requiredIngredients.length);
    const pantryCoverage = coverageTotal / ingredientCount;
    const expiringUse = expiringTotal / ingredientCount;
    const cashNeededForMealMinor = hasCompletePurchasePricing
      ? cashNeededMinor
      : candidate.affordableCostMinor;
    const budgetedCostMinor = preferences.affordabilityMode === "purchase-cost"
      ? cashNeededForMealMinor
      : candidate.affordableCostMinor;
    const budgetHeadroom = preferences.budgetMinor === 0
      ? (budgetedCostMinor === 0 ? 1 : 0)
      : Math.max(
          0,
          Math.min(1, (preferences.budgetMinor - budgetedCostMinor) / preferences.budgetMinor),
        );
    const timeHeadroom = Math.max(
      0,
      Math.min(1, (preferences.maxMinutes - candidate.totalMinutes) / preferences.maxMinutes),
    );

    const preferenceMatch = recommendationPreferenceMatch(candidate, preferences);
    const personalisation = preferences.personalisation?.get(candidate.id);
    const weights = recommendationScoringProfile.weights;
    const likedBonus = personalisation?.feedback === "liked" ? weights.liked : 0;
    const savedBonus = personalisation?.isSaved ? weights.saved : 0;
    const daysSinceLastEaten = personalisation?.lastEatenAt
      ? daysSince(personalisation.lastEatenAt, preferences.today)
      : null;
    const recentlyEatenPenalty =
      daysSinceLastEaten !== null && daysSinceLastEaten >= 0 && daysSinceLastEaten <= 7
        ? weights.eatenWithinSevenDays
        : daysSinceLastEaten !== null && daysSinceLastEaten <= 14 && daysSinceLastEaten >= 8
          ? weights.eatenWithinFourteenDays
          : 0;
    const score =
      pantryCoverage * weights.pantryCoverage +
      expiringUse * weights.expiringFood +
      budgetHeadroom * weights.budgetHeadroom +
      preferenceMatch * weights.preferenceMatch +
      timeHeadroom * weights.timeHeadroom +
      likedBonus +
      savedBonus -
      recentlyEatenPenalty;

    const reasonCandidates: Array<{ reason: string; strength: number }> = [];
    if (pantryCoverage > 0) {
      reasonCandidates.push({
        reason: `You already have ${Math.round(pantryCoverage * 100)}% of the required ingredients.`,
        strength: pantryCoverage * weights.pantryCoverage,
      });
    }
    if (expiringUse > 0) {
      reasonCandidates.push({
        reason: `Uses ${Math.max(1, Math.round(expiringTotal))} ingredient${expiringTotal >= 1.5 ? "s" : ""} due within 3 days.`,
        strength: expiringUse * weights.expiringFood,
      });
    }
    if (budgetHeadroom >= 0.05) {
      reasonCandidates.push({
        reason: `Leaves about KES ${Math.floor((preferences.budgetMinor - budgetedCostMinor) / 100).toLocaleString("en-KE")} in your meal budget.`,
        strength: budgetHeadroom * weights.budgetHeadroom,
      });
    }
    if (preferenceMatch > 0.5) {
      reasonCandidates.push({
        reason: "Matches your cuisine, dish, or health preferences.",
        strength: preferenceMatch * weights.preferenceMatch,
      });
    }
    if (savedBonus) {
      reasonCandidates.push({
        reason: "Saved in My Kitchen as a favourite.",
        strength: savedBonus,
      });
    }
    if (likedBonus) {
      reasonCandidates.push({
        reason: "You liked this meal before.",
        strength: likedBonus,
      });
    }
    if (recentlyEatenPenalty && daysSinceLastEaten !== null) {
      reasonCandidates.push({
        reason: `Moved lower for variety because you ate it ${daysSinceLastEaten === 0 ? "today" : `${daysSinceLastEaten} day${daysSinceLastEaten === 1 ? "" : "s"} ago`}.`,
        strength: recentlyEatenPenalty,
      });
    }
    if (timeHeadroom >= 0.1) {
      reasonCandidates.push({
        reason: `Fits with ${preferences.maxMinutes - candidate.totalMinutes} minutes to spare.`,
        strength: timeHeadroom * weights.timeHeadroom,
      });
    }
    reasonCandidates.push({
      reason: "Passes your dietary and kitchen-equipment requirements.",
      strength: 4,
    });

    const substitutions = requiredIngredients.flatMap((ingredient) =>
      ingredient.alternatives
        .filter(
          (alternative) =>
            alternative.estimatedCostMinor !== null &&
            ingredient.estimatedCostMinor !== null &&
            alternative.estimatedCostMinor < ingredient.estimatedCostMinor,
        )
        .map((alternative) => ({
          sourceIngredient: ingredient.name,
          alternativeIngredient: alternative.ingredient.name,
          quantity: Number((alternative.scaledQuantity * scale).toFixed(2)),
          unit: alternative.alternativeUnit,
          estimatedSavingMinor: Math.max(
            0,
            Math.round(
              ((ingredient.estimatedCostMinor ?? 0) -
                (alternative.estimatedCostMinor ?? 0)) *
                scale,
            ),
          ),
          note: alternative.note,
        })),
    );

    return {
      id: candidate.id,
      slug: candidate.slug,
      name: candidate.name,
      summary: candidate.summary,
      cuisine: candidate.cuisine,
      mealTypes: candidate.mealTypes,
      servings: preferences.servings,
      totalMinutes: candidate.totalMinutes,
      difficulty: candidate.difficulty,
      image: candidate.image,
      score: Number(score.toFixed(2)),
      reasons: reasonCandidates
        .sort((left, right) => right.strength - left.strength)
        .slice(0, 3)
        .map(({ reason }) => reason),
      estimatedCostMinor: candidate.estimatedCostMinor,
      affordableCostMinor: candidate.affordableCostMinor,
      cashNeededMinor: cashNeededForMealMinor,
      estimatedCostPerServingMinor: Math.ceil(
        candidate.affordableCostMinor / preferences.servings,
      ),
      pantryCoveragePercent: Math.round(pantryCoverage * 100),
      pantryIngredientNames,
      missingIngredients,
      substitutions,
    };
  });

  return ranked
    .filter((meal) =>
      preferences.affordabilityMode !== "purchase-cost" ||
      meal.cashNeededMinor <= preferences.budgetMinor,
    )
    .sort(
    (left, right) =>
      right.score - left.score ||
      left.cashNeededMinor - right.cashNeededMinor ||
      left.totalMinutes - right.totalMinutes ||
      left.name.localeCompare(right.name),
    );
}
