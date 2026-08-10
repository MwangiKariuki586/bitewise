import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GuidedCookMode } from "@/features/cook/guided-cook-mode";
import type { RecipeCatalogueItem } from "@/features/recipes/data";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/features/cook/actions", () => ({
  updateCookSessionAction: (input: unknown) => mocks.update(input),
}));
vi.mock("@/features/personalisation/actions", () => ({
  mutateRecipePersonalisationAction: vi.fn(),
}));

const recipe = {
  id: 8,
  slug: "test-meal",
  name: "Test meal",
  summary: "A complete recipe used to verify guided cooking behavior.",
  cuisine: "kenyan",
  mealTypes: ["dinner"],
  baseServings: 2,
  prepMinutes: 5,
  cookMinutes: 15,
  totalMinutes: 20,
  difficulty: "easy",
  acceptedHeatSources: ["gas_cooker"],
  requiredEquipment: [],
  dietaryTags: [],
  healthTags: [],
  instructions: ["Prepare the ingredients.", "Cook until ready."],
  image: null,
  ingredients: [{
    id: 1,
    slug: "beans",
    name: "Beans",
    quantity: 100,
    unit: "g",
    isOptional: false,
    preparation: null,
    estimatedCostMinor: 1_000,
    alternatives: [],
  }],
  estimatedCostMinor: 2_000,
  estimatedCostPerServingMinor: 1_000,
  costLocation: "Nairobi",
  costCapturedOn: "2026-08-01",
  costSourceLabel: "Test",
  costSourceUrl: "https://example.com",
} as RecipeCatalogueItem;

describe("GuidedCookMode", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.update.mockReset();
    mocks.update.mockResolvedValue({
      status: "success",
      data: { cookSessionId: 1, status: "active", currentStep: 2, completedSteps: 1 },
    });
  });

  it("scales ingredients and saves a completed step before moving forward", async () => {
    render(
      <GuidedCookMode
        recipe={recipe}
        servings={4}
        initialStep={1}
        initialCompletedSteps={[]}
        personalisation={{ feedback: null, isSaved: false, lastEatenAt: null }}
      />,
    );

    expect(screen.getByText("200 g")).toBeVisible();
    expect(screen.getByText("Prepare the ingredients.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(screen.getByText("Cook until ready.")).toBeVisible());
    expect(mocks.update).toHaveBeenCalledWith({
      operation: "step",
      recipeId: 8,
      stepNumber: 1,
      currentStep: 2,
      completed: true,
    });
  });
});
