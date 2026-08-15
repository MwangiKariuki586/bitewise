import "server-only";

import type { RecommendationPantryItem } from "@/features/recommendations/ranking";
import { createClient } from "@/lib/supabase/server";

export async function getRecipePantryItems(
  userId: string,
  ingredientIds: number[],
): Promise<RecommendationPantryItem[]> {
  if (!ingredientIds.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pantry_items")
    .select("ingredient_id,quantity,unit,expiry_date")
    .eq("user_id", userId)
    .in("ingredient_id", ingredientIds)
    .order("id")
    .limit(500);
  if (error) throw new Error("Your pantry context could not be loaded.");
  return data.map((item) => ({
    ingredientId: item.ingredient_id,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiry_date,
  }));
}
