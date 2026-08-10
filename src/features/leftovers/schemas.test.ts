import { describe, expect, it } from "vitest";

import { leftoverSchema } from "@/features/leftovers/schemas";

describe("leftover validation", () => {
  it("accepts a usable leftover", () => {
    expect(leftoverSchema.safeParse({ name: "Bean stew", recipeId: "", servings: "2.5", preparedDate: "2026-08-06", expiryDate: "2026-08-08", notes: "Chilled promptly" }).success).toBe(true);
  });

  it("accepts a canonical recipe reference when no custom name is supplied", () => {
    const result = leftoverSchema.safeParse({ name: "", recipeId: "12", servings: "2", preparedDate: "2026-08-06", expiryDate: "2026-08-08", notes: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ name: null, recipeId: 12 });
  });

  it("requires either a name or a recipe reference", () => {
    const result = leftoverSchema.safeParse({ name: "", recipeId: "", servings: "2", preparedDate: "2026-08-06", expiryDate: "2026-08-08", notes: "" });
    expect(result.success).toBe(false);
  });

  it("rejects expiry before preparation", () => {
    const result = leftoverSchema.safeParse({ name: "Pilau", recipeId: "", servings: 2, preparedDate: "2026-08-06", expiryDate: "2026-08-05", notes: "" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.expiryDate).toContain("Expiry cannot be before the prepared date.");
  });
});
