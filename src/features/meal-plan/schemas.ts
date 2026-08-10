import { z } from "zod";

export const mealTypes = ["breakfast", "lunch", "dinner"] as const;
export const mealTypeSchema = z.enum(mealTypes);
export type MealType = z.infer<typeof mealTypeSchema>;

function isMonday(value: string) {
  return new Date(`${value}T00:00:00Z`).getUTCDay() === 1;
}

export const weekStartSchema = z.iso
  .date("Choose a valid week.")
  .refine(isMonday, "The week must begin on a Monday.");

export const planSlotSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  mealType: mealTypeSchema,
});

export const planItemSchema = planSlotSchema.extend({
  recipeId: z.coerce.number().int().positive(),
  servings: z.coerce.number().int().min(1).max(30),
});

export const generatePlanSchema = z.object({
  weekStart: weekStartSchema,
});

export const planMutationSchema = planSlotSchema.extend({
  weekStart: weekStartSchema,
  operation: z.enum(["remove", "swap", "select", "set_servings"]),
  recipeId: z.coerce.number().int().positive().optional(),
  servings: z.coerce.number().int().min(1).max(30).optional(),
}).superRefine((value, context) => {
  if (value.operation === "select" && value.recipeId === undefined) {
    context.addIssue({
      code: "custom",
      message: "Choose a meal.",
      path: ["recipeId"],
    });
  }
  if (value.operation === "set_servings" && value.servings === undefined) {
    context.addIssue({
      code: "custom",
      message: "Choose a serving count.",
      path: ["servings"],
    });
  }
});

export interface PlanRpcItem {
  day_of_week: number;
  meal_type: MealType;
  recipe_id: number;
  servings: number;
}
