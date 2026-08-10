import "server-only";

import type { ShoppingListMutation } from "@/features/shopping-list/schemas";
import { createClient } from "@/lib/supabase/server";

const pageSize = 50;

export interface ShoppingListItem {
  estimatedCostMinor: number;
  id: number;
  isChecked: boolean;
  name: string;
  quantity: number;
  source: "generated" | "manual";
  unit: string;
}

export interface ActiveShoppingList {
  completedCount: number;
  createdAt: string;
  estimatedTotalMinor: number;
  id: number;
  items: ShoppingListItem[];
  mealPlanId: number;
  pageSize: number;
  totalItems: number;
  updatedAt: string;
  weekStart: string;
}

export async function getActiveShoppingList(userId: string, page: number) {
  const supabase = await createClient();
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select(`
      id,
      meal_plan_id,
      estimated_total_minor,
      created_at,
      updated_at,
      meal_plan:meal_plans!shopping_lists_plan_owner_fkey(week_start)
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (listError) throw new Error("Your active shopping list could not be loaded.");
  if (!list) return null;

  const from = (page - 1) * pageSize;
  const [itemsResult, completedResult] = await Promise.all([
    supabase
      .from("shopping_list_items")
      .select("id,name,quantity,unit,estimated_cost_minor,source,is_checked", { count: "exact" })
      .eq("user_id", userId)
      .eq("shopping_list_id", list.id)
      .order("is_checked", { ascending: true })
      .order("source", { ascending: true })
      .order("name", { ascending: true })
      .range(from, from + pageSize - 1),
    supabase
      .from("shopping_list_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("shopping_list_id", list.id)
      .eq("is_checked", true),
  ]);
  if (itemsResult.error || completedResult.error) {
    throw new Error("Your shopping items could not be loaded.");
  }

  return {
    completedCount: completedResult.count ?? 0,
    createdAt: list.created_at,
    estimatedTotalMinor: list.estimated_total_minor,
    id: list.id,
    items: itemsResult.data.map((item): ShoppingListItem => ({
      estimatedCostMinor: item.estimated_cost_minor,
      id: item.id,
      isChecked: item.is_checked,
      name: item.name,
      quantity: item.quantity,
      source: item.source as ShoppingListItem["source"],
      unit: item.unit,
    })),
    mealPlanId: list.meal_plan_id,
    pageSize,
    totalItems: itemsResult.count ?? 0,
    updatedAt: list.updated_at,
    weekStart: list.meal_plan.week_start,
  } satisfies ActiveShoppingList;
}

export async function getActiveShoppingListSummary(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select(`
      id,
      estimated_total_minor,
      meal_plan:meal_plans!shopping_lists_plan_owner_fkey(week_start),
      shopping_list_items(count)
    `)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error("Your shopping list summary could not be loaded.");
  if (!data) return null;
  return {
    estimatedTotalMinor: data.estimated_total_minor,
    id: data.id,
    itemCount: data.shopping_list_items[0]?.count ?? 0,
    weekStart: data.meal_plan.week_start,
  };
}

export async function regenerateShoppingList(mealPlanId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_shopping_list", {
    p_meal_plan_id: mealPlanId,
  });
  if (error || !data[0]) {
    throw new Error(error?.message ?? "The shopping list could not be generated.");
  }
  return data[0];
}

export async function mutateShoppingListItem(mutation: ShoppingListMutation) {
  const supabase = await createClient();
  const common = {
    p_operation: mutation.operation,
    p_shopping_list_id: mutation.shoppingListId,
  };
  const args = mutation.operation === "add"
    ? {
        ...common,
        p_name: mutation.name,
        p_quantity: mutation.quantity,
        p_unit: mutation.unit,
        p_estimated_cost_minor: mutation.estimatedCostMinor,
      }
    : mutation.operation === "toggle"
      ? { ...common, p_item_id: mutation.itemId, p_is_checked: mutation.isChecked }
      : mutation.operation === "delete"
        ? { ...common, p_item_id: mutation.itemId }
        : {
            ...common,
            p_item_id: mutation.itemId,
            p_name: mutation.name,
            p_quantity: mutation.quantity,
            p_unit: mutation.unit,
            p_estimated_cost_minor: mutation.estimatedCostMinor,
          };
  const { data, error } = await supabase.rpc("mutate_shopping_list_item", args);
  if (error || !data[0]) {
    throw new Error(error?.message ?? "The shopping item could not be saved.");
  }
  return data[0];
}
