import { z } from "zod";

import { pantryUnits } from "@/features/pantry/units";

const pantryUnitValues = pantryUnits.map(({ value }) => value) as [
  (typeof pantryUnits)[number]["value"],
  ...(typeof pantryUnits)[number]["value"][],
];

const quantitySchema = (allowZero: boolean) => z.preprocess(
  (value) => value === null || (typeof value === "string" && value.trim() === "") ? undefined : value,
  allowZero
    ? z.coerce.number("Enter a quantity.").nonnegative("Quantity cannot be negative.").max(1_000_000_000)
    : z.coerce.number("Enter a quantity.").positive("Quantity must be greater than zero.").max(1_000_000_000),
);

const pantryItemFields = {
  ingredientId: z.coerce.number().int().positive(),
  unit: z.enum(pantryUnitValues),
  expiryDate: z
    .union([z.literal(""), z.iso.date("Enter a valid expiry date.")])
    .transform((value) => value || null),
  notes: z.string().trim().max(300, "Use no more than 300 characters.").transform((value) => value || null),
};

export const pantryItemSchema = z.object({
  ...pantryItemFields,
  quantity: quantitySchema(false),
});

export const pantryItemUpdateSchema = z.object({
  ...pantryItemFields,
  quantity: quantitySchema(true),
});

export const pantryItemIdSchema = z.coerce.number().int().positive();

export const pantryCategories = [
  { label: "Produce", value: "produce" },
  { label: "Protein", value: "protein" },
  { label: "Grains & pulses", value: "grains" },
  { label: "Dairy", value: "dairy" },
  { label: "Pantry staples", value: "pantry-staples" },
  { label: "Other", value: "other" },
] as const;

const pantryCategoryValues = pantryCategories.map(({ value }) => value) as [
  (typeof pantryCategories)[number]["value"],
  ...(typeof pantryCategories)[number]["value"][],
];

export const pantryStatuses = ["all", "use-soon", "no-expiry", "in-stock"] as const;
export const pantryExpiryFilters = ["any", "expired", "3-days", "7-days", "30-days", "no-expiry"] as const;
export const pantrySorts = ["expiry-soon", "recently-added", "quantity-high"] as const;

export const pantryQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  search: z.string().trim().max(80).catch(""),
  edit: z.coerce.number().int().positive().optional().catch(undefined),
  status: z.enum(pantryStatuses).catch("all"),
  category: z.enum(["all", ...pantryCategoryValues]).catch("all"),
  expiry: z.enum(pantryExpiryFilters).catch("any"),
  sort: z.enum(pantrySorts).catch("expiry-soon"),
  showZero: z.literal("true").optional().catch(undefined).transform(Boolean),
  showArchived: z.literal("true").optional().catch(undefined).transform(Boolean),
});

export type PantryQuery = z.infer<typeof pantryQuerySchema>;

export function restrictPantryDeveloperFilters(query: PantryQuery, enabled: boolean): PantryQuery {
  return enabled ? query : { ...query, showZero: false, showArchived: false };
}

export function normalizePantryFilterConflicts(query: PantryQuery): PantryQuery {
  if ((query.status === "no-expiry" || query.status === "use-soon") && query.expiry !== "any") {
    return { ...query, expiry: "any" };
  }
  return query;
}
