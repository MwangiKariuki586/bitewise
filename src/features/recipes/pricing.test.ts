import { describe, expect, it } from "vitest";

import type { RecipeCatalogueItem } from "@/features/recipes/data";
import { cashNeededMinor, ingredientValueMinor } from "@/features/recipes/pricing";

const recipe = {
  id: 1,
  slug: "bean-stew",
  name: "Bean Stew",
  summary: "A practical bean stew.",
  cuisine: "kenyan",
  mealTypes: ["dinner"],
  baseServings: 4,
  prepMinutes: 10,
  cookMinutes: 30,
  totalMinutes: 40,
  difficulty: "easy",
  acceptedHeatSources: ["gas_cooker"],
  requiredEquipment: ["saucepan"],
  dietaryTags: ["vegetarian"],
  healthTags: ["high_fibre"],
  instructions: ["Cook the beans."],
  image: null,
  ingredients: [{
    id: 10,
    slug: "beans",
    name: "Beans",
    quantity: 400,
    unit: "g",
    isOptional: false,
    preparation: null,
    estimatedCostMinor: 8_000,
    purchasePack: { quantity: 1_000, unit: "g", priceMinor: 20_000 },
    alternatives: [],
  }],
  estimatedCostMinor: 8_000,
  estimatedCostPerServingMinor: 2_000,
  costLocation: "Nairobi",
  costCapturedOn: "2026-08-06",
  costSourceLabel: "Retail snapshot",
  costSourceUrl: "https://example.com",
} satisfies RecipeCatalogueItem;

describe("recipe detail pricing", () => {
  it("scales ingredient value to the selected servings", () => {
    expect(ingredientValueMinor(recipe, 1)).toBe(2_000);
    expect(ingredientValueMinor(recipe, 6)).toBe(12_000);
  });

  it("uses practical buying increments and deducts usable pantry stock for Eat Now", () => {
    expect(cashNeededMinor(recipe, [], 1, "2026-08-15")).toBe(2_000);
    expect(cashNeededMinor(recipe, [{ ingredientId: 10, quantity: 100, unit: "g", expiryDate: null }], 1, "2026-08-15")).toBe(0);
  });
});
