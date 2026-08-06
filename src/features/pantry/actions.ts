"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { pantryItemIdSchema, pantryItemSchema } from "@/features/pantry/schemas";

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ActionResult {
  return { status: "error", message: "Check the highlighted fields.", fieldErrors: error.flatten().fieldErrors };
}

function revalidatePantryConsumers() {
  revalidatePath("/my-kitchen");
  revalidatePath("/eat-now");
  revalidatePath("/meal-plan");
}

export async function savePantryItemAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const identity = await requireUser();
  const parsed = pantryItemSchema.safeParse({
    ingredientId: formData.get("ingredientId"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    expiryDate: formData.get("expiryDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const rawId = formData.get("id");
  const itemId = rawId ? pantryItemIdSchema.safeParse(rawId) : null;
  if (itemId && !itemId.success) return { status: "error", message: "That pantry item is invalid." };

  const supabase = await createClient();
  const values = {
    ingredient_id: parsed.data.ingredientId,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    expiry_date: parsed.data.expiryDate,
    notes: parsed.data.notes,
  };
  const result = itemId?.success
    ? await supabase.from("pantry_items").update(values).eq("id", itemId.data).eq("user_id", identity.sub).select("id").maybeSingle()
    : await supabase.from("pantry_items").insert({ ...values, user_id: identity.sub }).select("id").single();

  if (result.error?.code === "23505") {
    return { status: "error", message: "That ingredient, unit, and expiry date already exist in your pantry. Edit the existing item instead." };
  }
  if (result.error || !result.data) return { status: "error", message: "Your pantry item could not be saved." };

  revalidatePantryConsumers();
  return { status: "success", message: itemId?.success ? "Pantry item updated." : "Added to your pantry." };
}

export async function deletePantryItemAction(formData: FormData) {
  const identity = await requireUser();
  const itemId = pantryItemIdSchema.safeParse(formData.get("id"));
  if (!itemId.success) return;
  const supabase = await createClient();
  await supabase.from("pantry_items").delete().eq("id", itemId.data).eq("user_id", identity.sub);
  revalidatePantryConsumers();
}
