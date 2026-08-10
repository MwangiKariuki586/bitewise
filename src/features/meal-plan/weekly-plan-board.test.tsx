import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WeeklyPlanBoard } from "@/features/meal-plan/weekly-plan-board";
import type { CandidatesByMealType } from "@/features/meal-plan/generator";

vi.mock("@/features/meal-plan/actions", () => ({
  generateWeeklyPlanAction: vi.fn(),
  mutateWeeklyPlanAction: vi.fn(),
}));

vi.mock("@/features/shopping-list/actions", () => ({
  generateShoppingListAction: vi.fn(),
}));

const candidate = {
  recipeId: 1,
  name: "Githeri",
  score: 80,
  budgetedCostMinor: 25_000,
  estimatedCostMinor: 30_000,
  totalMinutes: 45,
};
const candidates: CandidatesByMealType = {
  breakfast: [{ ...candidate, recipeId: 1, name: "Uji" }],
  lunch: [{ ...candidate, recipeId: 2, name: "Githeri" }],
  dinner: [{ ...candidate, recipeId: 3, name: "Mukimo" }],
};

describe("WeeklyPlanBoard", () => {
  it("renders a complete seven-day, three-meal manual planning grid", () => {
    render(
      <WeeklyPlanBoard
        weekStart="2026-08-10"
        budgetLimitMinor={500_000}
        householdSize={4}
        plan={null}
        candidates={candidates}
      />,
    );

    expect(screen.getByRole("progressbar", { name: "Weekly budget used" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByRole("heading", { name: "Monday" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sunday" })).toBeInTheDocument();
    expect(screen.getAllByText("Open meal slot")).toHaveLength(21);
    expect(screen.getByRole("button", { name: "Generate complete week" })).toBeEnabled();
  });
});
