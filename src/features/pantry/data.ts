import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const pageSize = 20;
const pantryColumns =
  "id,ingredient_id,quantity,unit,expiry_date,notes,ingredient:ingredients!inner(id,name,slug,default_unit)";

export interface PantryQuery {
  page: number;
  search: string;
}

export async function getPantryPage({ page, search }: PantryQuery) {
  const identity = await requireUser();
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("pantry_items")
    .select(pantryColumns, { count: "exact" })
    .eq("user_id", identity.sub)
    .order("expiry_date", { ascending: true, nullsFirst: false })
    .order("id", { ascending: false })
    .range(from, from + pageSize - 1);

  if (search) query = query.ilike("ingredients.name", `%${search}%`);
  const { data, error, count } = await query;
  if (error) throw new Error("Your pantry could not be loaded.");

  return { items: data, total: count ?? 0, pageSize };
}

export async function getPantryFormData(editId?: number) {
  const identity = await requireUser();
  const supabase = await createClient();
  const ingredientsPromise = supabase
    .from("ingredients")
    .select("id,name,default_unit")
    .eq("is_active", true)
    .order("name")
    .limit(100);
  const itemPromise = editId
    ? supabase
        .from("pantry_items")
        .select("id,ingredient_id,quantity,unit,expiry_date,notes")
        .eq("user_id", identity.sub)
        .eq("id", editId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [ingredientsResult, itemResult] = await Promise.all([ingredientsPromise, itemPromise]);
  if (ingredientsResult.error || itemResult.error) throw new Error("Pantry form data could not be loaded.");
  return { ingredients: ingredientsResult.data, editItem: itemResult.data };
}
