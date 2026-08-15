import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecipeDetailView } from "@/features/recipes/recipe-detail-view";
import type { RecipeCatalogueItem } from "@/features/recipes/data";

vi.mock("@/features/meal-plan/add-to-meal-plan-control", () => ({
  AddToMealPlanControl: () => <button type="button">Add to meal plan</button>,
}));

vi.mock("@/features/personalisation/controls", () => ({
  RecipePersonalisationControls: () => <button type="button">More actions</button>,
}));

const recipe = {
  id: 1,
  slug: "black-bean-rice",
  name: "Black Bean Rice Bowl",
  summary: "Black beans and rice combined into a satisfying bowl.",
  cuisine: "kenyan",
  mealTypes: ["lunch", "dinner"],
  baseServings: 4,
  prepMinutes: 10,
  cookMinutes: 40,
  totalMinutes: 50,
  difficulty: "easy",
  acceptedHeatSources: ["gas_cooker"],
  requiredEquipment: ["saucepan"],
  dietaryTags: ["vegetarian"],
  healthTags: ["balanced_eating"],
  instructions: ["Cook and serve."],
  image: {
    path: "/images/recipes/coconut-beans-rice.webp",
    alt: "Black beans served with rice.",
    width: 960,
    height: 720,
    attributionName: "Photographer",
    attributionUrl: "https://example.com/photo",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://example.com/license",
  },
  ingredients: [],
  estimatedCostMinor: 25_100,
  estimatedCostPerServingMinor: 6_275,
  costLocation: "Nairobi",
  costCapturedOn: "2026-08-06",
  costSourceLabel: "Indicative retail snapshot",
  costSourceUrl: "https://example.com/cost",
} satisfies RecipeCatalogueItem;

describe("RecipeDetailView", () => {
  it("uses a stacked mobile image and a constrained tablet and desktop image region", () => {
    render(
      <RecipeDetailView
        recipe={recipe}
        personalisation={{ isSaved: false, feedback: null, lastEatenAt: null }}
        authenticated
      />,
    );

    const region = screen.getByTestId("recipe-hero-image");
    const image = screen.getByRole("img", { name: recipe.image.alt });

    expect(region).toHaveClass("h-60", "md:absolute", "md:w-[52%]", "xl:w-[52%]");
    expect(region.parentElement).not.toHaveClass("border-b");
    expect(image).toHaveClass("object-cover", "object-center");
  });
});
