"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  startCookSessionSchema,
  updateCookSessionSchema,
  type UpdateCookSessionInput,
} from "@/features/cook/schemas";
import { hasActiveCookSession } from "@/features/cook/data";
import { requireCompletedProfile } from "@/features/profile/data";
import { getRecipeCatalogue } from "@/features/recipes/data";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

interface CookMutationResult {
  cookSessionId: number;
  status: string;
  currentStep: number;
  completedSteps: number;
}

interface CookSetupContext {
  householdSize: number;
  hasActiveSession: boolean;
}

export async function getCookSetupContextAction(
  recipeId: number,
): Promise<ActionResult<CookSetupContext>> {
  const parsed = startCookSessionSchema.shape.recipeId.safeParse(recipeId);
  if (!parsed.success) {
    return { status: "error", message: "That recipe could not be opened in Cook Mode." };
  }

  const catalogue = await getRecipeCatalogue();
  const recipe = catalogue.find((item) => item.id === parsed.data);
  if (!recipe) {
    return { status: "error", message: "That recipe could not be opened in Cook Mode." };
  }

  const { identity, profile } = await requireCompletedProfile(`/recipes/${recipe.slug}`);
  const activeSession = await hasActiveCookSession(identity.sub, parsed.data);
  return {
    status: "success",
    data: {
      householdSize: profile.household_size,
      hasActiveSession: activeSession,
    },
  };
}

export async function startCookSessionAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = startCookSessionSchema.safeParse({
    recipeId: formData.get("recipeId"),
    servings: formData.get("servings"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Choose a serving count between 1 and 30.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await requireCompletedProfile(`/cook/${parsed.data.recipeId}`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("mutate_cook_session", {
    p_recipe_id: parsed.data.recipeId,
    p_operation: "start",
    p_servings: parsed.data.servings,
  });
  if (error) {
    return { status: "error", message: "This cooking session could not be started." };
  }

  revalidatePath("/cook");
  redirect(`/cook/${parsed.data.recipeId}`);
}

export async function updateCookSessionAction(
  input: UpdateCookSessionInput,
): Promise<ActionResult<CookMutationResult>> {
  await requireUser();
  const parsed = updateCookSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "That cooking update is invalid." };
  }

  const payload = parsed.data;
  const { recipeId, operation } = payload;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mutate_cook_session", {
    p_recipe_id: recipeId,
    p_operation: operation,
    p_step_number: operation === "step" ? payload.stepNumber : undefined,
    p_current_step:
      operation === "navigate"
        ? payload.currentStep
        : operation === "step"
          ? payload.currentStep
          : undefined,
    p_completed: operation === "step" ? payload.completed : undefined,
  });
  const result = data?.[0];
  if (error || !result) {
    return {
      status: "error",
      message:
        operation === "complete"
          ? "Complete every step before finishing the meal."
          : "Your cooking progress could not be saved.",
    };
  }

  revalidatePath("/cook");
  revalidatePath(`/cook/${recipeId}`);
  return {
    status: "success",
    message: operation === "complete" ? "Meal completed." : "Progress saved.",
    data: {
      cookSessionId: result.cook_session_id,
      status: result.session_status,
      currentStep: result.session_current_step,
      completedSteps: result.completed_steps,
    },
  };
}
