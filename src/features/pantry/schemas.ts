import { z } from "zod";

import { pantryUnits } from "@/features/pantry/units";

const pantryUnitValues = pantryUnits.map(({ value }) => value) as [
  (typeof pantryUnits)[number]["value"],
  ...(typeof pantryUnits)[number]["value"][],
];

export const pantryItemSchema = z.object({
  ingredientId: z.coerce.number().int().positive(),
  quantity: z.coerce
    .number("Enter a valid quantity.")
    .positive("Quantity must be greater than zero.")
    .max(1_000_000_000),
  unit: z.enum(pantryUnitValues),
  expiryDate: z
    .union([z.literal(""), z.iso.date("Enter a valid expiry date.")])
    .transform((value) => value || null),
  notes: z.string().trim().max(300, "Use no more than 300 characters.").transform((value) => value || null),
});

export const pantryItemIdSchema = z.coerce.number().int().positive();

export const pantryQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  search: z.string().trim().max(80).catch(""),
  edit: z.coerce.number().int().positive().optional().catch(undefined),
});
