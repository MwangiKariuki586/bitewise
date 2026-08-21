import "server-only";

import { createClient } from "@/lib/supabase/server";

export type RecommendationEventType =
  | "impression"
  | "opened"
  | "liked"
  | "disliked"
  | "feedback_undone"
  | "saved"
  | "unsaved"
  | "eaten";

export async function recordRecommendationEvents(
  runId: string,
  eventType: RecommendationEventType,
  recipeIds: number[],
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("record_recommendation_events", {
      p_event_type: eventType,
      p_recipe_ids: recipeIds,
      p_run_id: runId,
    });
    return error ? 0 : data;
  } catch {
    return 0;
  }
}
