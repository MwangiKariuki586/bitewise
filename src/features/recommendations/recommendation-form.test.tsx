import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecommendationForm } from "@/features/recommendations/recommendation-form";

const generateRecommendationsAction = vi.fn();
const scrollIntoView = vi.fn();

vi.mock("@/features/recommendations/actions", () => ({
  generateRecommendationsAction: (...args: unknown[]) => generateRecommendationsAction(...args),
}));

vi.mock("@/features/personalisation/controls", () => ({
  RecipePersonalisationControls: () => <button type="button">Save</button>,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));

const defaults = {
  budgetKes: 200,
  servings: 4,
  maxMinutes: 30,
  equipment: ["gas_cooker"],
  dietaryPreferences: [],
};

const successfulResult = {
  status: "success" as const,
  message: "Found 1 meal that fits.",
  data: {
    suggestions: [],
    applied: {
      budgetMinor: 20000,
      servings: 4,
      maxMinutes: 30,
      dietaryPreferences: [],
    },
    pricing: {
      location: "Nairobi",
      capturedOn: "2026-08-06",
      sourceLabel: "Indicative retail snapshot",
      sourceUrl: "https://example.com/prices",
    },
    meals: [{
      id: 1,
      slug: "githeri",
      name: "Githeri",
      summary: "A filling maize and bean meal.",
      cuisine: "kenyan",
      mealTypes: ["lunch"],
      servings: 4,
      totalMinutes: 30,
      difficulty: "Easy",
      image: null,
      score: 80,
      reasons: ["Fits the budget."],
      estimatedCostMinor: 15000,
      affordableCostMinor: 14000,
      cashNeededMinor: 18_000,
      estimatedCostPerServingMinor: 3500,
      pantryCoveragePercent: 75,
      pantryIngredientNames: ["maize"],
      missingIngredients: [],
      substitutions: [],
      personalisation: { feedback: null, isSaved: false, lastEatenAt: null },
    }],
  },
};

describe("RecommendationForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
    generateRecommendationsAction.mockReset();
    scrollIntoView.mockReset();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
  });

  it("shows the full form first and collapses to submitted values after success", async () => {
    generateRecommendationsAction.mockResolvedValue(successfulResult);
    const user = userEvent.setup();
    render(<RecommendationForm defaults={defaults} />);

    expect(screen.getByLabelText("Meal budget (KES)")).toBeVisible();
    expect(screen.getByLabelText("Meal budget (KES)")).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("Meal budget (KES)")).toHaveAttribute("step", "5");
    await user.clear(screen.getByLabelText("Meal budget (KES)"));
    await user.type(screen.getByLabelText("Meal budget (KES)"), "350");
    await user.click(screen.getByRole("button", { name: "Find meals that fit" }));

    await waitFor(() => expect(screen.queryByLabelText("Meal budget (KES)")).not.toBeInTheDocument());
    expect(screen.getByText("KES 350")).toBeVisible();
    expect(await screen.findByRole("link", { name: /View details/ })).toHaveAttribute("href", "/recipes/githeri?source=eat-now&servings=4");
    expect(screen.getByText("KES 180")).toBeVisible();
    expect(screen.getByText(/practical 100 g or 100 ml buying quantities/i)).toBeVisible();
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    expect(screen.getByLabelText("Meal budget (KES)")).toHaveValue(350);
  });

  it("keeps the form expanded when generation fails", async () => {
    generateRecommendationsAction.mockResolvedValue({
      status: "error",
      message: "BiteWise could not generate meals right now. Please try again.",
    });
    const user = userEvent.setup();
    render(<RecommendationForm defaults={defaults} />);

    await user.click(screen.getByRole("button", { name: "Find meals that fit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not generate");
    expect(screen.getByLabelText("Meal budget (KES)")).toBeVisible();
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("discards an incompatible legacy session instead of crashing", async () => {
    sessionStorage.setItem("bitewise:eat-now-state", JSON.stringify({
      result: successfulResult,
      constraints: {
        budgetKes: 350,
        servings: 4,
        maxMinutes: 30,
        mealType: "",
      },
      sort: "best",
      scrollY: 120,
    }));

    render(<RecommendationForm defaults={defaults} />);

    expect(screen.getByLabelText("Meal budget (KES)")).toBeVisible();
    await waitFor(() => {
      expect(sessionStorage.getItem("bitewise:eat-now-state")).toBeNull();
    });
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
  });
});
