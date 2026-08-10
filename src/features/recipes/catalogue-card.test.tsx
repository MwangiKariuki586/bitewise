import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecipeCatalogueCard } from "@/features/recipes/catalogue-card";
import type { RecipeCatalogueItem } from "@/features/recipes/data";

const recipe = {
  id: 1,
  slug: "ugali-sukuma-wiki",
  name: "Ugali with Sukuma Wiki",
  summary: "A dependable Kenyan staple served with quickly braised greens.",
  cuisine: "kenyan",
  mealTypes: ["lunch", "dinner"],
  baseServings: 4,
  prepMinutes: 10,
  cookMinutes: 30,
  totalMinutes: 40,
  difficulty: "easy",
  acceptedHeatSources: ["gas_cooker"],
  requiredEquipment: [],
  dietaryTags: ["vegetarian"],
  healthTags: ["balanced_eating"],
  instructions: ["Cook the ugali.", "Cook the greens."],
  image: {
    path: "/images/recipes/ugali-sukuma-wiki.webp",
    alt: "Ugali served beside cooked sukuma wiki.",
    width: 960,
    height: 720,
    attributionName: "Paresh Jai",
    attributionUrl:
      "https://commons.wikimedia.org/wiki/File:Ugali_%26_Sukuma_Wiki.jpg",
    licenseName: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  ingredients: [],
  estimatedCostMinor: 12_000,
  estimatedCostPerServingMinor: 3_000,
  costLocation: "Nairobi",
  costCapturedOn: "2026-08-06",
  costSourceLabel: "Carrefour Kenya indicative retail snapshot",
  costSourceUrl: "https://www.carrefour.ke/mafken/en/",
} satisfies RecipeCatalogueItem;

describe("RecipeCatalogueCard", () => {
  it("shows decision-critical cost, time, serving, and freshness information", () => {
    render(<RecipeCatalogueCard recipe={recipe} />);

    expect(screen.getByRole("heading", { name: recipe.name })).toBeInTheDocument();
    expect(screen.getByText("40 min")).toBeInTheDocument();
    expect(screen.getByText("KES 30")).toBeInTheDocument();
    expect(screen.getByText(/Estimated KES 120 total in Nairobi/)).toBeInTheDocument();
    expect(screen.getByText(/updated 2026-08-06/)).toBeInTheDocument();
  });

  it("renders licensed image attribution as external links", () => {
    render(<RecipeCatalogueCard recipe={recipe} />);

    expect(screen.getByRole("img", { name: recipe.image.alt })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Paresh Jai" })).toHaveAttribute(
      "href",
      recipe.image.attributionUrl,
    );
    expect(screen.getByRole("link", { name: "CC BY 2.0" })).toHaveAttribute(
      "href",
      recipe.image.licenseUrl,
    );
  });
});
