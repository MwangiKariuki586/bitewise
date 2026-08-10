import { z } from "zod";

export const startCookSessionSchema = z.object({
  recipeId: z.coerce.number().int().positive(),
  servings: z.coerce.number().int().min(1).max(30),
});

export const updateCookSessionSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("navigate"),
    recipeId: z.number().int().positive(),
    currentStep: z.number().int().min(1).max(30),
  }),
  z.object({
    operation: z.literal("step"),
    recipeId: z.number().int().positive(),
    stepNumber: z.number().int().min(1).max(30),
    currentStep: z.number().int().min(1).max(30).optional(),
    completed: z.boolean(),
  }),
  z.object({
    operation: z.literal("complete"),
    recipeId: z.number().int().positive(),
  }),
]);

export type UpdateCookSessionInput = z.infer<typeof updateCookSessionSchema>;
