import "server-only";

import {
  getRecipePersonalisation,
  type RecipePersonalisationState,
} from "@/features/personalisation/data";
import { getRecipeCatalogue } from "@/features/recipes/data";
import {
  rankRecommendations,
  type RecommendationCandidate,
  type RecommendedMeal,
} from "@/features/recommendations/ranking";
import type { RecommendationInput } from "@/features/recommendations/schemas";
import { createClient } from "@/lib/supabase/server";

export interface RecommendationProfilePreferences {
  healthGoals: string[];
  preferredCuisines: string[];
  preferredDishes: string[];
}

export interface RecommendationResponse {
  meals: (RecommendedMeal & { personalisation: RecipePersonalisationState })[];
  suggestions: string[];
  applied: {
    budgetMinor: number;
    servings: number;
    maxMinutes: number;
    dietaryPreferences: string[];
  };
  pricing: {
    location: string | null;
    capturedOn: string | null;
    sourceLabel: string | null;
    sourceUrl: string | null;
  };
}

function nairobiDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function noMatchSuggestions(
  input: RecommendationInput,
  pantryCount: number,
) {
  const heatSources = new Set(["gas_cooker", "electric_cooker", "jiko"]);
  const hasHeatSource = input.equipment.some((item) => heatSources.has(item));
  return [
    `Try increasing this meal budget above KES ${input.budgetKes.toLocaleString("en-KE")}.`,
    `Allow more than ${input.maxMinutes} minutes for a wider set of meals.`,
    hasHeatSource
      ? "Add any other equipment you can use today to widen the kitchen match."
      : "Select a gas cooker, electric cooker, or jiko that you can use today.",
    pantryCount > 0
      ? "Check pantry quantities and expiry dates so usable ingredients count toward the match."
      : "Add a few staple pantry ingredients so BiteWise can identify lower-shopping options.",
    "Your dietary requirements remain fixed and were not relaxed.",
  ];
}

export async function getRecommendations(
  userId: string,
  input: RecommendationInput,
  dietaryPreferences: string[],
  profile: RecommendationProfilePreferences,
): Promise<RecommendationResponse> {
  const supabase = await createClient();
  const cataloguePromise = getRecipeCatalogue();
  const candidatesPromise = supabase.rpc("get_recommendation_candidates", {
    p_budget_minor: input.budgetKes * 100,
    p_dietary: dietaryPreferences,
    p_equipment: input.equipment,
    p_max_minutes: input.maxMinutes,
    p_meal_type: input.mealType ?? undefined,
    p_servings: input.servings,
  });
  const pantryPromise = supabase
    .from("pantry_items")
    .select("ingredient_id,quantity,unit,expiry_date")
    .eq("user_id", userId)
    .order("id")
    .limit(500);

  const [catalogue, candidateResult, pantryResult] = await Promise.all([
    cataloguePromise,
    candidatesPromise,
    pantryPromise,
  ]);
  if (candidateResult.error || pantryResult.error) {
    throw new Error("Meal matches could not be loaded.");
  }

  const catalogueById = new Map(catalogue.map((recipe) => [recipe.id, recipe]));
  const candidates = candidateResult.data.flatMap((row): RecommendationCandidate[] => {
    const recipe = catalogueById.get(row.recipe_id);
    if (!recipe) return [];
    return [
      {
        id: recipe.id,
        slug: recipe.slug,
        name: recipe.name,
        summary: recipe.summary,
        cuisine: recipe.cuisine,
        mealTypes: recipe.mealTypes,
        baseServings: recipe.baseServings,
        totalMinutes: recipe.totalMinutes,
        difficulty: recipe.difficulty,
        healthTags: recipe.healthTags,
        ingredients: recipe.ingredients,
        image: recipe.image,
        estimatedCostMinor: row.estimated_cost_minor,
        affordableCostMinor: row.affordable_cost_minor,
        usesSubstitution: row.uses_substitution,
      },
    ];
  });

  const personalisation = await getRecipePersonalisation(
    userId,
    candidates.map((candidate) => candidate.id),
  );

  const rankedMeals = rankRecommendations(
    candidates,
    pantryResult.data.map((item) => ({
      ingredientId: item.ingredient_id,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiry_date,
    })),
    {
      budgetMinor: input.budgetKes * 100,
      servings: input.servings,
      maxMinutes: input.maxMinutes,
      healthGoals: profile.healthGoals,
      preferredCuisines: profile.preferredCuisines,
      preferredDishes: profile.preferredDishes,
      today: nairobiDateKey(),
      personalisation,
      affordabilityMode: "purchase-cost",
    },
  ).slice(0, 5);
  const meals = rankedMeals.map((meal) => ({
    ...meal,
    personalisation: personalisation.get(meal.id) ?? {
      feedback: null,
      isSaved: false,
      lastEatenAt: null,
    },
  }));

  return {
    meals,
    suggestions: meals.length
      ? []
      : noMatchSuggestions(input, pantryResult.data.length),
    applied: {
      budgetMinor: input.budgetKes * 100,
      servings: input.servings,
      maxMinutes: input.maxMinutes,
      dietaryPreferences,
    },
    pricing: {
      location: catalogue[0]?.costLocation ?? null,
      capturedOn: catalogue[0]?.costCapturedOn ?? null,
      sourceLabel: catalogue[0]?.costSourceLabel ?? null,
      sourceUrl: catalogue[0]?.costSourceUrl ?? null,
    },
  };
}
