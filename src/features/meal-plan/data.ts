import "server-only";

import { getRecipePersonalisation } from "@/features/personalisation/data";
import { getRecipeCatalogue } from "@/features/recipes/data";
import {
  rankRecommendations,
  type RecommendationCandidate,
} from "@/features/recommendations/ranking";
import {
  toPlanCandidate,
  type CandidatesByMealType,
  type PlanCandidate,
} from "@/features/meal-plan/generator";
import { mealTypes, type MealType, type PlanRpcItem } from "@/features/meal-plan/schemas";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export interface MealPlanProfile {
  available_minutes: number;
  breakfast_minutes: number;
  lunch_minutes: number;
  dinner_minutes: number;
  budget_minor: number | null;
  budget_period: string;
  dietary_preferences: string[];
  equipment: string[];
  health_goals: string[];
  household_size: number;
  preferred_cuisines: string[];
  preferred_dishes: string[];
}

export function planningMinutes(
  profile: MealPlanProfile,
  mealType: MealType,
) {
  if (mealType === "breakfast") return profile.breakfast_minutes;
  if (mealType === "lunch") return profile.lunch_minutes;
  return profile.dinner_minutes;
}

export interface WeeklyPlanItem {
  id: number;
  dayOfWeek: number;
  mealType: MealType;
  recipeId: number;
  servings: number;
  estimatedCostMinor: number;
  budgetedCostMinor: number;
    recipe: {
      name: string;
      slug: string;
      totalMinutes: number;
      difficulty: string;
      imagePath: string | null;
  };
}

export interface WeeklyPlan {
  id: number;
  weekStart: string;
  budgetLimitMinor: number;
  estimatedTotalMinor: number;
  items: WeeklyPlanItem[];
}

export interface MealPlanConstraintDiagnostic {
  mealType: MealType;
  currentCount: number;
  timeLimitMinutes: number;
  timeCandidateCount: number;
  suggestedBudgetMinor: number;
  budgetCandidateCount: number;
}

export interface PlanCandidateOption extends PlanCandidate {
  mealType: MealType;
}

function nairobiDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function weeklyBudgetMinor(profile: MealPlanProfile) {
  if (!profile.budget_minor || profile.budget_minor <= 0) return 10_000;
  return profile.budget_period === "weekly"
    ? profile.budget_minor
    : profile.budget_minor * 7;
}

export async function getWeeklyPlan(userId: string, weekStart: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal_plans")
    .select(`
      id,
      week_start,
      budget_limit_minor,
      estimated_total_minor,
      meal_plan_items(
        id,
        day_of_week,
        meal_type,
        recipe_id,
        servings,
        estimated_cost_minor,
        budgeted_cost_minor,
        recipe:recipes!meal_plan_items_recipe_id_fkey(
          name,
          slug,
          prep_minutes,
          cook_minutes,
          difficulty
          ,recipe_images(local_path,is_primary)
        )
      )
    `)
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) throw new Error("Your weekly plan could not be loaded.");
  if (!data) return null;

  return {
    id: data.id,
    weekStart: data.week_start,
    budgetLimitMinor: data.budget_limit_minor,
    estimatedTotalMinor: data.estimated_total_minor,
    items: data.meal_plan_items
      .map((item): WeeklyPlanItem => ({
        id: item.id,
        dayOfWeek: item.day_of_week,
        mealType: item.meal_type as MealType,
        recipeId: item.recipe_id,
        servings: item.servings,
        estimatedCostMinor: item.estimated_cost_minor,
        budgetedCostMinor: item.budgeted_cost_minor,
        recipe: {
          name: item.recipe.name,
          slug: item.recipe.slug,
          totalMinutes: item.recipe.prep_minutes + item.recipe.cook_minutes,
          difficulty: item.recipe.difficulty,
          imagePath:
            item.recipe.recipe_images.find((image) => image.is_primary)?.local_path ?? null,
        },
      }))
      .sort((left, right) =>
        left.dayOfWeek - right.dayOfWeek ||
        mealTypes.indexOf(left.mealType) - mealTypes.indexOf(right.mealType),
      ),
  } satisfies WeeklyPlan;
}

export async function getPlanCandidates(
  userId: string,
  profile: MealPlanProfile,
  servings = profile.household_size,
) {
  const supabase = await createClient();
  const budgetLimitMinor = weeklyBudgetMinor(profile);
  const cataloguePromise = getRecipeCatalogue();
  const pantryPromise = supabase
    .from("pantry_items")
    .select("ingredient_id,quantity,unit,expiry_date")
    .eq("user_id", userId)
    .order("id")
    .limit(500);
  const candidatePromises = mealTypes.map((mealType) =>
    supabase.rpc("get_recommendation_candidates", {
      p_budget_minor: Math.min(budgetLimitMinor, 100_000_000),
      p_dietary: profile.dietary_preferences,
      p_equipment: profile.equipment,
      p_max_minutes: planningMinutes(profile, mealType),
      p_meal_type: mealType,
      p_servings: servings,
    }),
  );

  const [catalogue, pantryResult, ...candidateResults] = await Promise.all([
    cataloguePromise,
    pantryPromise,
    ...candidatePromises,
  ]);
  if (pantryResult.error || candidateResults.some((result) => result.error)) {
    throw new Error("Eligible weekly meals could not be loaded.");
  }

  const catalogueById = new Map(catalogue.map((recipe) => [recipe.id, recipe]));
  const pantry = pantryResult.data.map((item) => ({
    ingredientId: item.ingredient_id,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiry_date,
  }));
  const mappedByMealType = mealTypes.map((mealType, index) => {
    const mapped = (candidateResults[index].data ?? []).flatMap(
      (row): RecommendationCandidate[] => {
        const recipe = catalogueById.get(row.recipe_id);
        if (!recipe) return [];
        return [{
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
        }];
      },
    );
    return [mealType, mapped] as const;
  });
  const personalisation = await getRecipePersonalisation(
    userId,
    mappedByMealType.flatMap(([, mapped]) => mapped.map((candidate) => candidate.id)),
  );
  const candidates = Object.fromEntries(
    mappedByMealType.map(([mealType, mapped]) => {
      const ranked = rankRecommendations(mapped, pantry, {
        budgetMinor: budgetLimitMinor,
        servings,
        maxMinutes: planningMinutes(profile, mealType),
        healthGoals: profile.health_goals,
        preferredCuisines: profile.preferred_cuisines,
        preferredDishes: profile.preferred_dishes,
        today: nairobiDateKey(),
        personalisation,
      }).map(toPlanCandidate);
      return [mealType, ranked];
    }),
  ) as CandidatesByMealType;

  return candidates;
}

export async function getMealPlanConstraintDiagnostics(
  profile: MealPlanProfile,
  candidates: CandidatesByMealType,
): Promise<MealPlanConstraintDiagnostic[]> {
  const limitedMealTypes = mealTypes.filter(
    (mealType) => candidates[mealType].length < 7,
  );
  if (!limitedMealTypes.length) return [];

  const supabase = await createClient();
  const currentBudgetMinor = weeklyBudgetMinor(profile);
  const suggestedBudgetMinor = Math.min(
    100_000_000,
    Math.ceil(currentBudgetMinor * 1.2),
  );
  const baseArgs = {
    p_dietary: profile.dietary_preferences,
    p_equipment: profile.equipment,
    p_servings: profile.household_size,
  };
  const probes = await Promise.all(
    limitedMealTypes.flatMap((mealType) => {
      const currentTimeLimit = planningMinutes(profile, mealType);
      const timeLimitMinutes = Math.min(480, currentTimeLimit + 15);
      return [
      supabase.rpc("get_recommendation_candidates", {
        ...baseArgs,
        p_budget_minor: Math.min(currentBudgetMinor, 100_000_000),
        p_max_minutes: timeLimitMinutes,
        p_meal_type: mealType,
      }),
      supabase.rpc("get_recommendation_candidates", {
        ...baseArgs,
        p_budget_minor: suggestedBudgetMinor,
        p_max_minutes: currentTimeLimit,
        p_meal_type: mealType,
      }),
      ];
    }),
  );

  return limitedMealTypes.map((mealType, index) => {
    const timeProbe = probes[index * 2];
    const budgetProbe = probes[index * 2 + 1];
    return {
      mealType,
      currentCount: candidates[mealType].length,
      timeLimitMinutes: Math.min(480, planningMinutes(profile, mealType) + 15),
      timeCandidateCount: timeProbe.error
        ? candidates[mealType].length
        : (timeProbe.data?.length ?? 0),
      suggestedBudgetMinor,
      budgetCandidateCount: budgetProbe.error
        ? candidates[mealType].length
        : (budgetProbe.data?.length ?? 0),
    };
  });
}

export async function replaceWeeklyPlan(
  weekStart: string,
  budgetLimitMinor: number,
  items: PlanRpcItem[],
) {
  const supabase = await createClient();
  const payload: Json = items.map((item) => ({
    day_of_week: item.day_of_week,
    meal_type: item.meal_type,
    recipe_id: item.recipe_id,
    servings: item.servings,
  }));
  const { data, error } = await supabase.rpc("replace_weekly_meal_plan", {
    p_week_start: weekStart,
    p_budget_limit_minor: budgetLimitMinor,
    p_items: payload,
  });
  if (error || !data[0]) {
    throw new Error(error?.message ?? "The weekly plan could not be saved.");
  }
  return data[0];
}
