import { z } from "zod";

import {
  cuisineOptions,
  dietaryOptions,
  equipmentOptions,
  healthGoalOptions,
} from "@/features/profile/options";

const values = <TValue extends string>(
  options: readonly { value: TValue }[],
) => options.map(({ value }) => value) as [TValue, ...TValue[]];

export const basicsSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name.").max(80),
  budgetPeriod: z.enum(["daily", "weekly"]),
  budgetKes: z.coerce
    .number("Enter a valid budget.")
    .int("Use a whole KES amount.")
    .min(100, "Budget must be at least KES 100.")
    .max(1_000_000, "Budget must be KES 1,000,000 or less."),
  householdSize: z.coerce
    .number()
    .int()
    .min(1, "Household must include at least one person.")
    .max(30, "Household size must be 30 or less."),
});

export const kitchenSchema = z.object({
  availableMinutes: z.coerce
    .number()
    .int()
    .min(5, "Choose at least 5 minutes.")
    .max(480, "Choose no more than 8 hours."),
  equipment: z.array(z.enum(values(equipmentOptions))).max(9),
});

export const preferencesSchema = z.object({
  dietaryPreferences: z.array(z.enum(values(dietaryOptions))).max(7),
  healthGoals: z.array(z.enum(values(healthGoalOptions))).max(7),
  preferredCuisines: z.array(z.enum(values(cuisineOptions))).max(10),
  preferredDishes: z
    .array(z.string().trim().min(2).max(80))
    .max(12, "Add no more than 12 favourite dishes."),
});

export function uniqueFormValues(formData: FormData, key: string) {
  return [...new Set(formData.getAll(key).filter((value): value is string => typeof value === "string"))];
}

export function preferredDishValues(formData: FormData) {
  const raw = formData.get("preferredDishes");
  if (typeof raw !== "string" || !raw.trim()) return [];
  return [...new Set(raw.split(/[\n,]/).map((dish) => dish.trim()).filter(Boolean))];
}
