import { describe, expect, it } from "vitest";

import { scaleIngredientQuantity } from "@/features/cook/scale";

describe("scaleIngredientQuantity", () => {
  it("scales quantities linearly from the recipe serving count", () => {
    expect(scaleIngredientQuantity(500, 4, 6)).toBe(750);
    expect(scaleIngredientQuantity(1, 4, 2)).toBe(0.5);
  });
});
