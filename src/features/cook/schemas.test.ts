import { describe, expect, it } from "vitest";

import {
  startCookSessionSchema,
  updateCookSessionSchema,
} from "@/features/cook/schemas";

describe("cook session schemas", () => {
  it("coerces a valid session start", () => {
    expect(startCookSessionSchema.parse({ recipeId: "12", servings: "4" })).toEqual({
      recipeId: 12,
      servings: 4,
    });
  });

  it("rejects invalid progress operations", () => {
    expect(
      updateCookSessionSchema.safeParse({
        operation: "step",
        recipeId: 2,
        stepNumber: 0,
        completed: true,
      }).success,
    ).toBe(false);
  });
});
