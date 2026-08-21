"use server";

import { revalidatePath } from "next/cache";

import type { RecipePersonalisationState } from "@/features/personalisation/data";
import { personalisationOperationSchema } from "@/features/personalisation/schemas";
import { recordRecommendationEvents, type RecommendationEventType } from "@/features/recommendations/events";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function mutateRecipePersonalisationAction(
  input: unknown,
): Promise<ActionResult<RecipePersonalisationState>> {
  await requireUser();
  const parsed = personalisationOperationSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "That meal preference is invalid." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mutate_recipe_personalisation", {
    p_recipe_id: parsed.data.recipeId,
    p_operation: parsed.data.operation,
  });
  const result = data?.[0];
  if (error || !result) {
    return { status: "error", message: "That meal preference could not be saved." };
  }

  if (parsed.data.recommendationRunId) {
    const eventByOperation: Partial<Record<typeof parsed.data.operation, RecommendationEventType>> = {
      dislike: "disliked",
      eaten: "eaten",
      like: "liked",
      save: "saved",
      unsave: "unsaved",
      undo_feedback: "feedback_undone",
    };
    const eventType = eventByOperation[parsed.data.operation];
    if (eventType) {
      await recordRecommendationEvents(
        parsed.data.recommendationRunId,
        eventType,
        [parsed.data.recipeId],
      );
    }
  }

  revalidatePath("/eat-now");
  revalidatePath("/discover");
  revalidatePath(`/recipes/[slug]`, "page");
  revalidatePath("/cook");
  revalidatePath("/my-kitchen");
  return {
    status: "success",
    message:
      parsed.data.operation === "eaten"
        ? "Added to recently eaten."
        : "Meal preference saved.",
    data: {
      feedback: (result.feedback_state as "liked" | "disliked" | null) ?? null,
      isSaved: result.is_saved,
      lastEatenAt: result.last_eaten_at,
    },
  };
}
