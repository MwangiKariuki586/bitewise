"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  basicsSchema,
  kitchenSchema,
  preferencesSchema,
  preferredDishValues,
  uniqueFormValues,
} from "@/features/profile/schemas";

function fields(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function errors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ActionResult {
  return {
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function returnPath(formData: FormData) {
  const value = formData.get("returnTo");
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/eat-now";
}

function formPath(formData: FormData) {
  return formData.get("formPath") === "/profile/edit" ? "/profile/edit" : "/onboarding";
}

function nextStep(step: string, returnTo: string, pathname: string) {
  const params = new URLSearchParams({ step });
  if (returnTo !== "/eat-now") params.set("returnTo", returnTo);
  return `${pathname}?${params.toString()}`;
}

export async function saveBasicsAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const identity = await requireUser();
  const parsed = basicsSchema.safeParse(fields(formData));
  if (!parsed.success) return errors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: identity.sub,
      display_name: parsed.data.displayName,
      budget_period: parsed.data.budgetPeriod,
      budget_minor: parsed.data.budgetKes * 100,
      household_size: parsed.data.householdSize,
    },
    { onConflict: "user_id" },
  );
  if (error) return { status: "error", message: "Your changes could not be saved." };

  revalidatePath("/profile");
  redirect(nextStep("kitchen", returnPath(formData), formPath(formData)));
}

export async function saveKitchenAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const identity = await requireUser();
  const parsed = kitchenSchema.safeParse({
    availableMinutes: formData.get("availableMinutes"),
    equipment: uniqueFormValues(formData, "equipment"),
  });
  if (!parsed.success) return errors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: identity.sub,
      available_minutes: parsed.data.availableMinutes,
      equipment: parsed.data.equipment,
    },
    { onConflict: "user_id" },
  );
  if (error) return { status: "error", message: "Your changes could not be saved." };

  revalidatePath("/profile");
  redirect(nextStep("preferences", returnPath(formData), formPath(formData)));
}

export async function savePreferencesAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const identity = await requireUser();
  const parsed = preferencesSchema.safeParse({
    dietaryPreferences: uniqueFormValues(formData, "dietaryPreferences"),
    healthGoals: uniqueFormValues(formData, "healthGoals"),
    preferredCuisines: uniqueFormValues(formData, "preferredCuisines"),
    preferredDishes: preferredDishValues(formData),
  });
  if (!parsed.success) return errors(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: identity.sub,
      dietary_preferences: parsed.data.dietaryPreferences,
      health_goals: parsed.data.healthGoals,
      preferred_cuisines: parsed.data.preferredCuisines,
      preferred_dishes: parsed.data.preferredDishes,
      onboarding_completed: true,
    },
    { onConflict: "user_id" },
  );
  if (error) return { status: "error", message: "Your changes could not be saved." };

  revalidatePath("/profile");
  revalidatePath("/eat-now");
  revalidatePath("/meal-plan");
  redirect(returnPath(formData));
}
