import { describe, expect, it } from "vitest";

import { parseRecipeViewContext, recipeViewHref } from "@/features/recipes/view-context";

describe("recipe view context", () => {
  it("keeps a validated source and serving count", () => {
    expect(parseRecipeViewContext({ source: "eat-now", servings: "6" })).toEqual({
      source: "eat-now",
      servings: 6,
    });
  });

  it("uses a safe one-serving direct view for invalid input", () => {
    expect(parseRecipeViewContext({ source: "unknown", servings: "100" })).toEqual({
      source: "direct",
      servings: 1,
    });
  });

  it("builds an explicit contextual recipe URL", () => {
    expect(recipeViewHref("githeri", "discover", 1)).toBe(
      "/recipes/githeri?source=discover&servings=1",
    );
  });
});
