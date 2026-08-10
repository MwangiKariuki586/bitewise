import { z } from "zod";

import { pantryUnits } from "@/features/pantry/units";

const unitValues = pantryUnits.map(({ value }) => value) as [
  (typeof pantryUnits)[number]["value"],
  ...(typeof pantryUnits)[number]["value"][],
];

const positiveId = z.coerce.number().int().positive();
const quantity = z.coerce
  .number("Enter a valid quantity.")
  .positive("Quantity must be greater than zero.")
  .max(999_999_999);
const estimatedCostKes = z.coerce
  .number("Enter a valid estimated cost.")
  .min(0, "Estimated cost cannot be negative.")
  .max(10_000_000)
  .transform((value) => Math.round(value * 100));

export const generateShoppingListSchema = z.object({ mealPlanId: positiveId });

export const shoppingListPageSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
});

export const shoppingListMutationSchema = z
  .object({
    shoppingListId: positiveId,
    operation: z.enum(["add", "edit", "toggle", "delete"]),
    itemId: positiveId.optional(),
    name: z.string().trim().max(120).optional(),
    quantity: quantity.optional(),
    unit: z.enum(unitValues).optional(),
    estimatedCostMinor: estimatedCostKes.optional(),
    isChecked: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  })
  .superRefine((value, context) => {
    if (value.operation !== "add" && !value.itemId) {
      context.addIssue({ code: "custom", path: ["itemId"], message: "Choose a valid shopping item." });
    }
    if (value.operation === "toggle" && value.isChecked === undefined) {
      context.addIssue({ code: "custom", path: ["isChecked"], message: "Choose a checked state." });
    }
    if (value.operation === "add" || value.operation === "edit") {
      if (value.operation === "add" && (!value.name || value.name.length < 2)) {
        context.addIssue({ code: "custom", path: ["name"], message: "Use at least 2 characters." });
      }
      if (!value.quantity) {
        context.addIssue({ code: "custom", path: ["quantity"], message: "Enter a quantity." });
      }
      if (value.operation === "add" && !value.unit) {
        context.addIssue({ code: "custom", path: ["unit"], message: "Choose a unit." });
      }
      if (value.estimatedCostMinor === undefined) {
        context.addIssue({ code: "custom", path: ["estimatedCostMinor"], message: "Enter an estimated cost." });
      }
    }
  });

export type ShoppingListMutation = z.infer<typeof shoppingListMutationSchema>;
