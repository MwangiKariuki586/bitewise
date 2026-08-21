import { z } from "zod";

import {
  dietaryOptions,
  equipmentOptions,
} from "@/features/profile/options";

const optionValues = <TValue extends string>(
  options: readonly { value: TValue }[],
) => options.map(({ value }) => value) as [TValue, ...TValue[]];

export const recommendationInputSchema = z.object({
  budgetKes: z.coerce
    .number("Enter a valid meal budget.")
    .int("Use a whole KES amount.")
    .min(0, "Meal budget cannot be negative.")
    .max(1_000_000, "Meal budget must be KES 1,000,000 or less."),
  servings: z.coerce.number().int().min(1).max(30),
  maxMinutes: z.coerce.number().int().min(5).max(480),
  mealType: z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(["breakfast", "lunch", "dinner", "snack"]).nullable(),
  ),
  equipment: z.array(z.enum(optionValues(equipmentOptions))).max(9),
  dietaryPreferences: z.array(z.enum(optionValues(dietaryOptions))).max(7),
});

export type RecommendationInput = z.infer<typeof recommendationInputSchema>;

export const recommendationEventInputSchema = z.object({
  runId: z.uuid(),
  eventType: z.enum(["impression", "opened"]),
  recipeIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(5)
    .refine((recipeIds) => new Set(recipeIds).size === recipeIds.length, {
      message: "Recommendation recipes must be unique.",
    }),
});

export function defaultMealBudgetMinor(
  budgetMinor: number | null,
  budgetPeriod: string,
) {
  if (!budgetMinor || budgetMinor <= 0) return 10_000;
  return Math.max(
    10_000,
    Math.floor(budgetMinor / (budgetPeriod === "weekly" ? 21 : 3)),
  );
}
