import { z } from "zod";

export const personalisationOperationSchema = z.object({
  recipeId: z.number().int().positive(),
  operation: z.enum([
    "like",
    "dislike",
    "undo_feedback",
    "save",
    "unsave",
    "eaten",
  ]),
});

export type PersonalisationOperation = z.infer<
  typeof personalisationOperationSchema
>["operation"];
