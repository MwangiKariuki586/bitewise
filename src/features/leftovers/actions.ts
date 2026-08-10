"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { leftoverIdSchema, leftoverSchema } from "@/features/leftovers/schemas";

function refreshConsumers() {
  revalidatePath("/my-kitchen");
  revalidatePath("/my-kitchen/leftovers");
  revalidatePath("/eat-now");
}

export async function saveLeftoverAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const identity = await requireUser();
  const parsed = leftoverSchema.safeParse({
    name: formData.get("name"),
    recipeId: formData.get("recipeId"),
    servings: formData.get("servings"),
    preparedDate: formData.get("preparedDate"),
    expiryDate: formData.get("expiryDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { status: "error", message: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  const rawId = formData.get("id");
  const itemId = rawId ? leftoverIdSchema.safeParse(rawId) : null;
  if (itemId && !itemId.success) return { status: "error", message: "That leftover is invalid." };

  const supabase = await createClient();
  const recipeResult = parsed.data.recipeId
    ? await supabase.from("recipes").select("id,name").eq("id", parsed.data.recipeId).eq("is_active", true).maybeSingle()
    : { data: null, error: null };
  if (recipeResult.error || (parsed.data.recipeId && !recipeResult.data)) {
    return { status: "error", message: "That BiteWise recipe is unavailable." };
  }
  const values = { name: parsed.data.name ?? recipeResult.data?.name ?? "Leftover meal", recipe_id: parsed.data.recipeId ?? null, servings: parsed.data.servings, prepared_date: parsed.data.preparedDate, expiry_date: parsed.data.expiryDate, notes: parsed.data.notes };
  const result = itemId?.success
    ? await supabase.from("leftovers").update(values).eq("id", itemId.data).eq("user_id", identity.sub).select("id").maybeSingle()
    : await supabase.from("leftovers").insert({ ...values, user_id: identity.sub }).select("id").single();
  if (result.error || !result.data) return { status: "error", message: "Your leftover could not be saved." };
  refreshConsumers();
  return { status: "success", message: itemId?.success ? "Leftover updated." : "Leftover saved." };
}

export async function deleteLeftoverAction(formData: FormData) {
  const identity = await requireUser();
  const id = leftoverIdSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("leftovers").delete().eq("id", id.data).eq("user_id", identity.sub);
  refreshConsumers();
}
