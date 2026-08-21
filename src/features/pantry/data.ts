import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PantryQuery } from "@/features/pantry/schemas";

const pageSize = 20;
const pantryColumns =
  "id,ingredient_id,quantity,unit,expiry_date,notes,created_at,archived_at,ingredient:ingredients!inner(id,name,slug,default_unit,category)";

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDaysKey(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

export async function getPantryPage(filters: PantryQuery) {
  const identity = await requireUser();
  const supabase = await createClient();
  const from = (filters.page - 1) * pageSize;
  let builder = supabase
    .from("pantry_items")
    .select(pantryColumns, { count: "exact" })
    .eq("user_id", identity.sub)
    .range(from, from + pageSize - 1);

  if (!filters.showArchived) builder = builder.is("archived_at", null);
  if (!filters.showZero) builder = builder.gt("quantity", 0);
  if (filters.search) builder = builder.ilike("ingredients.name", `%${filters.search}%`);
  if (filters.category !== "all") builder = builder.eq("ingredients.category", filters.category);

  const today = dateKey();
  if (filters.status === "use-soon") {
    builder = builder.not("expiry_date", "is", null).gte("expiry_date", today).lte("expiry_date", addDaysKey(7));
  } else if (filters.status === "no-expiry") {
    builder = builder.is("expiry_date", null);
  } else if (filters.status === "in-stock") {
    builder = builder.gt("quantity", 0);
  }

  if (filters.expiry === "expired") {
    builder = builder.lt("expiry_date", today);
  } else if (filters.expiry === "no-expiry") {
    builder = builder.is("expiry_date", null);
  } else if (filters.expiry !== "any") {
    const days = Number(filters.expiry.split("-")[0]);
    builder = builder.gte("expiry_date", today).lte("expiry_date", addDaysKey(days));
  }

  if (filters.sort === "recently-added") {
    builder = builder.order("created_at", { ascending: false }).order("id", { ascending: false });
  } else if (filters.sort === "quantity-high") {
    builder = builder.order("quantity", { ascending: false }).order("id", { ascending: false });
  } else {
    builder = builder.order("expiry_date", { ascending: true, nullsFirst: false }).order("id", { ascending: false });
  }

  const { data, error, count } = await builder;
  if (error) throw new Error("Your pantry could not be loaded.");

  return { items: data, total: count ?? 0, pageSize };
}

export async function getPantryHighlights(filters: PantryQuery) {
  const identity = await requireUser();
  const supabase = await createClient();
  const today = dateKey();
  const countBase = () => supabase
    .from("pantry_items")
    .select("id,ingredient:ingredients!inner(name,category)", { count: "exact", head: true })
    .eq("user_id", identity.sub);
  const rowBase = () => supabase
    .from("pantry_items")
    .select(pantryColumns)
    .eq("user_id", identity.sub);

  const filterCounts = (initial: ReturnType<typeof countBase>) => {
    let builder = initial;
    if (!filters.showArchived) builder = builder.is("archived_at", null);
    if (!filters.showZero) builder = builder.gt("quantity", 0);
    if (filters.search) builder = builder.ilike("ingredients.name", `%${filters.search}%`);
    if (filters.category !== "all") builder = builder.eq("ingredients.category", filters.category);
    if (filters.status === "use-soon") builder = builder.not("expiry_date", "is", null).gte("expiry_date", today).lte("expiry_date", addDaysKey(7));
    else if (filters.status === "no-expiry") builder = builder.is("expiry_date", null);
    else if (filters.status === "in-stock") builder = builder.gt("quantity", 0);
    if (filters.expiry === "expired") builder = builder.lt("expiry_date", today);
    else if (filters.expiry === "no-expiry") builder = builder.is("expiry_date", null);
    else if (filters.expiry !== "any") {
      const days = Number(filters.expiry.split("-")[0]);
      builder = builder.gte("expiry_date", today).lte("expiry_date", addDaysKey(days));
    }
    return builder;
  };
  const filterRows = (initial: ReturnType<typeof rowBase>) => {
    let builder = initial;
    if (!filters.showArchived) builder = builder.is("archived_at", null);
    if (!filters.showZero) builder = builder.gt("quantity", 0);
    if (filters.search) builder = builder.ilike("ingredients.name", `%${filters.search}%`);
    if (filters.category !== "all") builder = builder.eq("ingredients.category", filters.category);
    if (filters.status === "use-soon") builder = builder.not("expiry_date", "is", null).gte("expiry_date", today).lte("expiry_date", addDaysKey(7));
    else if (filters.status === "no-expiry") builder = builder.is("expiry_date", null);
    else if (filters.status === "in-stock") builder = builder.gt("quantity", 0);
    if (filters.expiry === "expired") builder = builder.lt("expiry_date", today);
    else if (filters.expiry === "no-expiry") builder = builder.is("expiry_date", null);
    else if (filters.expiry !== "any") {
      const days = Number(filters.expiry.split("-")[0]);
      builder = builder.gte("expiry_date", today).lte("expiry_date", addDaysKey(days));
    }
    return builder;
  };

  const [attention, noExpiry, useSoon] = await Promise.all([
    filterCounts(countBase()).not("expiry_date", "is", null).gte("expiry_date", today).lte("expiry_date", addDaysKey(7)),
    filterCounts(countBase()).is("expiry_date", null),
    filterRows(rowBase())
      .not("expiry_date", "is", null)
      .gte("expiry_date", today)
      .lte("expiry_date", addDaysKey(7))
      .order("expiry_date", { ascending: true })
      .order("id", { ascending: false })
      .limit(4),
  ]);
  if (attention.error || noExpiry.error || useSoon.error) {
    throw new Error("Pantry highlights could not be loaded.");
  }
  return {
    attentionCount: attention.count ?? 0,
    noExpiryCount: noExpiry.count ?? 0,
    useSoonItems: useSoon.data,
    today,
  };
}

export async function getPantryFormData(editId?: number) {
  const identity = await requireUser();
  const supabase = await createClient();
  const ingredientsPromise = supabase
    .from("ingredients")
    .select("id,name,default_unit,category")
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
