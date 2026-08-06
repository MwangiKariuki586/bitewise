import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const pageSize = 20;

export async function getLeftoversPage(page: number, search: string, editId?: number) {
  const identity = await requireUser();
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  let listQuery = supabase.from("leftovers").select("id,name,servings,prepared_date,expiry_date,notes,recipe_id", { count: "exact" }).eq("user_id", identity.sub).order("expiry_date").order("id", { ascending: false }).range(from, from + pageSize - 1);
  if (search) listQuery = listQuery.ilike("name", `%${search}%`);
  const editQuery = editId
    ? supabase.from("leftovers").select("id,name,servings,prepared_date,expiry_date,notes").eq("user_id", identity.sub).eq("id", editId).maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [list, edit] = await Promise.all([listQuery, editQuery]);
  if (list.error || edit.error) throw new Error("Your leftovers could not be loaded.");
  return { items: list.data, total: list.count ?? 0, pageSize, editItem: edit.data };
}
