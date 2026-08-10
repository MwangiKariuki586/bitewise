import { z } from "zod";

export const leftoverSchema = z
  .object({
    name: z.string().trim().max(100).transform((value) => value || null),
    recipeId: z.preprocess(
      (value) => value === "" || value === null ? undefined : value,
      z.coerce.number().int().positive().optional(),
    ),
    servings: z.coerce.number().positive("Servings must be greater than zero.").max(100),
    preparedDate: z.iso.date("Enter a valid prepared date."),
    expiryDate: z.iso.date("Enter a valid expiry date."),
    notes: z.string().trim().max(500, "Use no more than 500 characters.").transform((value) => value || null),
  })
  .refine(({ name, recipeId }) => Boolean(name || recipeId), {
    message: "Enter a name or choose a BiteWise recipe.",
    path: ["name"],
  })
  .refine(({ expiryDate, preparedDate }) => expiryDate >= preparedDate, {
    message: "Expiry cannot be before the prepared date.",
    path: ["expiryDate"],
  });

export const leftoverIdSchema = z.coerce.number().int().positive();
export const leftoverQuerySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  search: z.string().trim().max(80).catch(""),
  edit: z.coerce.number().int().positive().optional().catch(undefined),
});
