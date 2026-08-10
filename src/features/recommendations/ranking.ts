export interface RecommendationIngredientAlternative {
  ingredient: { id: number; name: string };
  scaledQuantity: number;
  alternativeUnit: string;
  estimatedCostMinor: number | null;
  note: string;
}

export interface RecommendationIngredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  estimatedCostMinor: number | null;
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
  estimatedCostPerServingMinor: number;
  pantryCoveragePercent: number;
  pantryIngredientNames: string[];
  missingIngredients: RecommendationMissingIngredient[];
  substitutions: RecommendationSubstitution[];
}

interface NormalizedQuantity {
  group: string;
  value: number;
}

function normalizeQuantity(quantity: number, unit: string): NormalizedQuantity {
  if (unit === "kg") return { group: "mass", value: quantity * 1_000 };
  if (unit === "g") return { group: "mass", value: quantity };
  if (unit === "l") return { group: "volume", value: quantity * 1_000 };
  if (unit === "ml") return { group: "volume", value: quantity };
  return { group: unit, value: quantity };
}

function quantityInUnit(quantity: number, fromUnit: string, toUnit: string) {
  const from = normalizeQuantity(quantity, fromUnit);
  const to = normalizeQuantity(1, toUnit);
  if (from.group !== to.group) return 0;
  return from.value / to.value;
}

function datePlusDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysSince(dateTime: string, today: string) {
  const eatenAt = new Date(`${dateTime.slice(0, 10)}T00:00:00Z`).getTime();
  const current = new Date(`${today}T00:00:00Z`).getTime();
  if (!Number.isFinite(eatenAt) || !Number.isFinite(current)) return null;
  return Math.floor((current - eatenAt) / 86_400_000);
}

function preferredDishMatch(name: string, preferredDishes: string[]) {
  const normalizedName = name.toLocaleLowerCase("en-KE");
  return preferredDishes.some((dish) => {
    const normalizedDish = dish.trim().toLocaleLowerCase("en-KE");
    return normalizedDish.length >= 2 &&
      (normalizedName.includes(normalizedDish) || normalizedDish.includes(normalizedName));
  });
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
        missingIngredients.push({
          ingredientId: ingredient.id,
          name: ingredient.name,
          quantity: Number((requiredQuantity - availableQuantity).toFixed(2)),
          unit: ingredient.unit,
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
    const budgetHeadroom = Math.max(
      0,
      Math.min(1, (preferences.budgetMinor - candidate.affordableCostMinor) / preferences.budgetMinor),
    );
    const timeHeadroom = Math.max(
      0,
      Math.min(1, (preferences.maxMinutes - candidate.totalMinutes) / preferences.maxMinutes),
    );

    const preferenceSignals: number[] = [];
    if (preferences.preferredCuisines.length > 0) {
      preferenceSignals.push(
        preferences.preferredCuisines.includes(candidate.cuisine) ? 1 : 0,
      );
    }
    if (preferences.healthGoals.length > 0) {
      preferenceSignals.push(
        candidate.healthTags.filter((tag) => preferences.healthGoals.includes(tag)).length /
          preferences.healthGoals.length,
      );
    }
    if (preferences.preferredDishes.length > 0) {
      preferenceSignals.push(
        preferredDishMatch(candidate.name, preferences.preferredDishes) ? 1 : 0,
      );
    }
    const preferenceMatch = preferenceSignals.length
      ? preferenceSignals.reduce((total, value) => total + value, 0) /
        preferenceSignals.length
      : 0.5;
    const variety = 0.5;
    const personalisation = preferences.personalisation?.get(candidate.id);
    const likedBonus = personalisation?.feedback === "liked" ? 6 : 0;
    const savedBonus = personalisation?.isSaved ? 8 : 0;
    const daysSinceLastEaten = personalisation?.lastEatenAt
      ? daysSince(personalisation.lastEatenAt, preferences.today)
      : null;
    const recentlyEatenPenalty =
      daysSinceLastEaten !== null && daysSinceLastEaten >= 0 && daysSinceLastEaten <= 7
        ? 20
        : daysSinceLastEaten !== null && daysSinceLastEaten <= 14 && daysSinceLastEaten >= 8
          ? 10
          : 0;
    const score =
      pantryCoverage * 30 +
      expiringUse * 20 +
      budgetHeadroom * 15 +
      preferenceMatch * 15 +
      timeHeadroom * 10 +
      variety * 10 +
      likedBonus +
      savedBonus -
      recentlyEatenPenalty;

    const reasonCandidates: Array<{ reason: string; strength: number }> = [];
    if (pantryCoverage > 0) {
      reasonCandidates.push({
        reason: `You already have ${Math.round(pantryCoverage * 100)}% of the required ingredients.`,
        strength: pantryCoverage * 30,
      });
    }
    if (expiringUse > 0) {
      reasonCandidates.push({
        reason: `Uses ${Math.max(1, Math.round(expiringTotal))} ingredient${expiringTotal >= 1.5 ? "s" : ""} due within 3 days.`,
        strength: expiringUse * 20,
      });
    }
    if (budgetHeadroom >= 0.05) {
      reasonCandidates.push({
        reason: `Leaves about KES ${Math.floor((preferences.budgetMinor - candidate.affordableCostMinor) / 100).toLocaleString("en-KE")} in your meal budget.`,
        strength: budgetHeadroom * 15,
      });
    }
    if (preferenceMatch > 0.5) {
      reasonCandidates.push({
        reason: "Matches your cuisine, dish, or health preferences.",
        strength: preferenceMatch * 15,
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
        strength: timeHeadroom * 10,
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
      estimatedCostPerServingMinor: Math.ceil(
        candidate.affordableCostMinor / preferences.servings,
      ),
      pantryCoveragePercent: Math.round(pantryCoverage * 100),
      pantryIngredientNames,
      missingIngredients,
      substitutions,
    };
  });

  return ranked.sort(
    (left, right) =>
      right.score - left.score ||
      left.affordableCostMinor - right.affordableCostMinor ||
      left.totalMinutes - right.totalMinutes ||
      left.name.localeCompare(right.name),
  );
}
