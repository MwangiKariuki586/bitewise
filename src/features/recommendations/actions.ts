"use server";

import type { ActionResult } from "@/lib/action-result";
import { consumeRateLimit } from "@/lib/rate-limit";
import { requireCompletedProfile } from "@/features/profile/data";
import {
  getRecommendations,
  type RecommendationResponse,
} from "@/features/recommendations/data";
import { recordRecommendationEvents } from "@/features/recommendations/events";
import {
  recommendationEventInputSchema,
  recommendationInputSchema,
} from "@/features/recommendations/schemas";
import { requireUser } from "@/lib/auth/session";

function stringValues(formData: FormData, key: string) {
  return [
    ...new Set(
      formData
        .getAll(key)
        .filter((value): value is string => typeof value === "string"),
    ),
  ];
}

export async function generateRecommendationsAction(
  _state: ActionResult<RecommendationResponse>,
  formData: FormData,
): Promise<ActionResult<RecommendationResponse>> {
  const { identity, profile } = await requireCompletedProfile();
  const parsed = recommendationInputSchema.safeParse({
    budgetKes: formData.get("budgetKes"),
    servings: formData.get("servings"),
    maxMinutes: formData.get("maxMinutes"),
    mealType: formData.get("mealType"),
    equipment: stringValues(formData, "equipment"),
    dietaryPreferences: stringValues(formData, "dietaryPreferences"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted meal details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const allowed = await consumeRateLimit({
    action: "eat_now_recommendations",
    identifier: identity.sub,
    limit: 20,
    windowSeconds: 600,
  });
  if (!allowed) {
    return {
      status: "error",
      message: "You have generated several meal lists. Try again in a few minutes.",
    };
  }

  const dietaryPreferences = [
    ...new Set([
      ...profile.dietary_preferences,
      ...parsed.data.dietaryPreferences,
    ]),
  ];

  try {
    const data = await getRecommendations(
      identity.sub,
      parsed.data,
      dietaryPreferences,
      {
        healthGoals: profile.health_goals,
        preferredCuisines: profile.preferred_cuisines,
        preferredDishes: profile.preferred_dishes,
      },
    );
    return {
      status: "success",
      message: data.meals.length
        ? `Found ${data.meals.length} meal${data.meals.length === 1 ? "" : "s"} that fit.`
        : "No meal meets every hard constraint yet.",
      data,
    };
  } catch {
    return {
      status: "error",
      message: "BiteWise could not generate meals right now. Please try again.",
    };
  }
}

export async function recordRecommendationEventAction(input: unknown) {
  await requireUser();
  const parsed = recommendationEventInputSchema.safeParse(input);
  if (!parsed.success) return { status: "error" as const };
  const recorded = await recordRecommendationEvents(
    parsed.data.runId,
    parsed.data.eventType,
    [...new Set(parsed.data.recipeIds)],
  );
  return recorded === parsed.data.recipeIds.length
    ? { status: "success" as const }
    : { status: "error" as const };
}
