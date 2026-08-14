"use server";

import { revalidatePath } from "next/cache";

import {
  getPlanCandidates,
  getWeeklyPlan,
  replaceWeeklyPlan,
  weeklyBudgetMinor,
} from "@/features/meal-plan/data";
import { generateDeterministicWeeklyPlan } from "@/features/meal-plan/generator";
import {
  addRecipeToPlanSchema,
  generatePlanSchema,
  mealTypes,
  planMutationSchema,
  type AddRecipeToPlanInput,
  type MealType,
  type PlanRpcItem,
} from "@/features/meal-plan/schemas";
import { currentWeekStart, shiftWeek } from "@/features/meal-plan/dates";
import { requireCompletedProfile } from "@/features/profile/data";
import { getRecipeCatalogue } from "@/features/recipes/data";
import type { ActionResult } from "@/lib/action-result";
import { consumeRateLimit } from "@/lib/rate-limit";

function planItemsForRpc(plan: NonNullable<Awaited<ReturnType<typeof getWeeklyPlan>>>) {
  return plan.items.map((item): PlanRpcItem => ({
    day_of_week: item.dayOfWeek,
    meal_type: item.mealType,
    recipe_id: item.recipeId,
    servings: item.servings,
  }));
}

function mutationError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("exceeds the active budget")) {
    return "That change would take the plan over budget. Remove or swap another meal first.";
  }
  if (message.includes("fit profile constraints")) {
    return "That meal no longer fits your saved time, equipment, dietary, or price constraints.";
  }
  return "The weekly plan could not be saved. Please try again.";
}

export interface AddToMealPlanSlot {
  dayOfWeek: number;
  mealType: MealType;
  recipeId: number;
  recipeName: string;
}

export interface AddToMealPlanContext {
  householdSize: number;
  currentDayOfWeek: number;
  mealTypes: MealType[];
  weeks: Array<{
    weekStart: string;
    label: "This week" | "Next week";
    slots: AddToMealPlanSlot[];
  }>;
}

export interface AddToMealPlanSuccess {
  weekStart: string;
  dayOfWeek: number;
  mealType: MealType;
}

function nairobiDayOfWeek() {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return (day + 6) % 7;
}

function compatibleMealTypes(values: string[]): MealType[] {
  return mealTypes.filter((mealType) => values.includes(mealType));
}

export async function getAddToMealPlanContextAction(
  recipeId: number,
): Promise<ActionResult<AddToMealPlanContext>> {
  const recipeIdResult = addRecipeToPlanSchema.shape.recipeId.safeParse(recipeId);
  if (!recipeIdResult.success) return { status: "error", message: "That recipe is unavailable." };
  const catalogue = await getRecipeCatalogue();
  const recipe = catalogue.find((item) => item.id === recipeIdResult.data);
  if (!recipe) return { status: "error", message: "That recipe is unavailable." };
  const supportedMealTypes = compatibleMealTypes(recipe.mealTypes);
  if (!supportedMealTypes.length) return { status: "error", message: "This recipe does not fit a weekly meal slot." };
  const { identity, profile } = await requireCompletedProfile(`/recipes/${recipe.slug}`);
  const thisWeek = currentWeekStart();
  const nextWeek = shiftWeek(thisWeek, 1);
  const plans = await Promise.all([
    getWeeklyPlan(identity.sub, thisWeek),
    getWeeklyPlan(identity.sub, nextWeek),
  ]);
  return {
    status: "success",
    data: {
      householdSize: profile.household_size,
      currentDayOfWeek: nairobiDayOfWeek(),
      mealTypes: supportedMealTypes,
      weeks: [
        { weekStart: thisWeek, label: "This week", slots: plans[0]?.items.map((item) => ({ dayOfWeek: item.dayOfWeek, mealType: item.mealType, recipeId: item.recipeId, recipeName: item.recipe.name })) ?? [] },
        { weekStart: nextWeek, label: "Next week", slots: plans[1]?.items.map((item) => ({ dayOfWeek: item.dayOfWeek, mealType: item.mealType, recipeId: item.recipeId, recipeName: item.recipe.name })) ?? [] },
      ],
    },
  };
}

export async function addRecipeToMealPlanAction(
  input: AddRecipeToPlanInput,
): Promise<ActionResult<AddToMealPlanSuccess>> {
  const parsed = addRecipeToPlanSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Check the meal-plan slot before saving.", fieldErrors: parsed.error.flatten().fieldErrors };
  const catalogue = await getRecipeCatalogue();
  const recipe = catalogue.find((item) => item.id === parsed.data.recipeId);
  if (!recipe) return { status: "error", message: "That recipe is unavailable." };
  const { identity, profile } = await requireCompletedProfile(`/recipes/${recipe.slug}`);
  if (!recipe.mealTypes.includes(parsed.data.mealType)) {
    return { status: "error", message: "This recipe does not fit that meal slot." };
  }
  const allowedWeeks = [currentWeekStart(), shiftWeek(currentWeekStart(), 1)];
  if (!allowedWeeks.includes(parsed.data.weekStart)) {
    return { status: "error", message: "Choose this week or next week." };
  }
  if (parsed.data.weekStart === allowedWeeks[0] && parsed.data.dayOfWeek < nairobiDayOfWeek()) {
    return { status: "error", message: "Choose today or a future day." };
  }
  const plan = await getWeeklyPlan(identity.sub, parsed.data.weekStart);
  const items = plan ? planItemsForRpc(plan) : [];
  const current = plan?.items.find((item) => item.dayOfWeek === parsed.data.dayOfWeek && item.mealType === parsed.data.mealType);
  const currentRecipeId = current?.recipeId ?? null;
  if (currentRecipeId !== parsed.data.expectedRecipeId) {
    return { status: "error", message: "That slot changed while you were choosing. Review it and try again." };
  }
  if (current && !parsed.data.replaceConfirmed) {
    return { status: "error", message: `${current.recipe.name} is already in that slot. Confirm that you want to replace it.` };
  }
  const selected: PlanRpcItem = {
    day_of_week: parsed.data.dayOfWeek,
    meal_type: parsed.data.mealType,
    recipe_id: parsed.data.recipeId,
    servings: parsed.data.servings,
  };
  const nextItems = [
    ...items.filter((item) => item.day_of_week !== parsed.data.dayOfWeek || item.meal_type !== parsed.data.mealType),
    selected,
  ];
  try {
    await replaceWeeklyPlan(parsed.data.weekStart, weeklyBudgetMinor(profile), nextItems);
    revalidatePath("/meal-plan");
    return { status: "success", message: "Meal added to the week.", data: { weekStart: parsed.data.weekStart, dayOfWeek: parsed.data.dayOfWeek, mealType: parsed.data.mealType } };
  } catch (error) {
    return { status: "error", message: mutationError(error) };
  }
}

export async function generateWeeklyPlanAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = generatePlanSchema.safeParse({ weekStart: formData.get("weekStart") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Choose a valid Monday to plan this week.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { identity, profile } = await requireCompletedProfile();
  const allowed = await consumeRateLimit({
    action: "weekly_plan_generation",
    identifier: identity.sub,
    limit: 10,
    windowSeconds: 600,
  });
  if (!allowed) {
    return {
      status: "error",
      message: "You have generated several plans. Try again in a few minutes.",
    };
  }

  try {
    const budgetLimitMinor = weeklyBudgetMinor(profile);
    const [candidates, existingPlan] = await Promise.all([
      getPlanCandidates(identity.sub, profile),
      getWeeklyPlan(identity.sub, parsed.data.weekStart),
    ]);
    const generated = generateDeterministicWeeklyPlan(
      candidates,
      profile.household_size,
      budgetLimitMinor,
      new Set(existingPlan?.items.map((item) => item.recipeId) ?? []),
    );
    if (!generated) {
      return {
        status: "error",
        message: "A complete 21-meal week does not fit yet. Increase the weekly budget, available time, or kitchen equipment in Profile.",
      };
    }
    await replaceWeeklyPlan(parsed.data.weekStart, budgetLimitMinor, generated.items);
    revalidatePath("/meal-plan");
    return {
      status: "success",
      message: generated.usedDuplicates
        ? "Plan generated within budget. A few meals repeat because no affordable unique set fit every slot."
        : "A complete week was generated within budget without repeating a recipe.",
    };
  } catch (error) {
    return { status: "error", message: mutationError(error) };
  }
}

export async function mutateWeeklyPlanAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = planMutationSchema.safeParse({
    weekStart: formData.get("weekStart"),
    operation: formData.get("operation"),
    dayOfWeek: formData.get("dayOfWeek"),
    mealType: formData.get("mealType"),
    recipeId: formData.get("recipeId") || undefined,
    servings: formData.get("servings") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check this meal before saving it.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { identity, profile } = await requireCompletedProfile();
  const plan = await getWeeklyPlan(identity.sub, parsed.data.weekStart);
  const slotMatches = (item: PlanRpcItem) =>
    item.day_of_week === parsed.data.dayOfWeek &&
    item.meal_type === parsed.data.mealType;
  let items = plan ? planItemsForRpc(plan) : [];
  const current = items.find(slotMatches);

  if (parsed.data.operation !== "select" && !current) {
    return { status: "error", message: "That meal slot is already empty." };
  }

  try {
    if (parsed.data.operation === "remove") {
      items = items.filter((item) => !slotMatches(item));
    }

    if (parsed.data.operation === "set_servings" && current && parsed.data.servings) {
      current.servings = parsed.data.servings;
    }

    if (parsed.data.operation === "select" && parsed.data.recipeId) {
      const selected: PlanRpcItem = {
        day_of_week: parsed.data.dayOfWeek,
        meal_type: parsed.data.mealType,
        recipe_id: parsed.data.recipeId,
        servings: parsed.data.servings ?? profile.household_size,
      };
      items = [...items.filter((item) => !slotMatches(item)), selected];
    }

    if (parsed.data.operation === "swap" && current && plan) {
      const allowed = await consumeRateLimit({
        action: "weekly_plan_swap",
        identifier: identity.sub,
        limit: 30,
        windowSeconds: 600,
      });
      if (!allowed) {
        return {
          status: "error",
          message: "You have made several swaps. Try again in a few minutes.",
        };
      }
      const candidates = await getPlanCandidates(identity.sub, profile, current.servings);
      const usedRecipeIds = new Set(items.map((item) => item.recipe_id));
      const remainingBudget =
        weeklyBudgetMinor(profile) - (plan.estimatedTotalMinor -
          (plan.items.find((item) =>
            item.dayOfWeek === current.day_of_week && item.mealType === current.meal_type
          )?.budgetedCostMinor ?? 0));
      const pool = candidates[current.meal_type].filter(
        (candidate) =>
          candidate.recipeId !== current.recipe_id &&
          candidate.budgetedCostMinor <= remainingBudget,
      );
      const replacement =
        pool.find((candidate) => !usedRecipeIds.has(candidate.recipeId)) ?? pool[0];
      if (!replacement) {
        return {
          status: "error",
          message: "No different meal fits this slot and the remaining weekly budget.",
        };
      }
      current.recipe_id = replacement.recipeId;
    }

    await replaceWeeklyPlan(
      parsed.data.weekStart,
      weeklyBudgetMinor(profile),
      items,
    );
    revalidatePath("/meal-plan");
    return {
      status: "success",
      message:
        parsed.data.operation === "remove"
          ? "Meal removed."
          : parsed.data.operation === "swap"
            ? "Meal swapped within your constraints."
            : parsed.data.operation === "select"
              ? "Meal added to the week."
              : "Serving count updated.",
    };
  } catch (error) {
    return { status: "error", message: mutationError(error) };
  }
}
