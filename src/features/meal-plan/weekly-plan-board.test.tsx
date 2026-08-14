import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  it("keeps one mobile day editable and offers a condensed whole-week view", async () => {
    const user = userEvent.setup();
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
    const mobilePlan = screen.getByRole("region", { name: "Mobile meal plan" });
    const desktopPlan = screen.getByRole("region", { name: "Seven-day meal plan" });
    const daySelector = screen.getByRole("group", { name: "Choose a day" });
    expect(within(mobilePlan).getByRole("heading", { name: "Monday" })).toBeInTheDocument();
    expect(within(mobilePlan).getAllByText("Open meal slot")).toHaveLength(3);
    expect(within(desktopPlan).getByText(/Use View whole week/)).toBeInTheDocument();

    await user.click(within(daySelector).getByRole("button", { name: "Tue 11" }));
    expect(within(mobilePlan).getByRole("heading", { name: "Tuesday" })).toBeInTheDocument();

    await user.click(within(mobilePlan).getByRole("button", { name: "View whole week" }));
    expect(within(mobilePlan).getByRole("button", { name: "Edit Sunday 16 Aug" })).toBeInTheDocument();
    expect(within(mobilePlan).getByRole("button", { name: "Back to selected day" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate complete week" })).toBeEnabled();
  });

  it("explains a constrained meal pool and links to the setting that unlocks options", () => {
    render(
      <WeeklyPlanBoard
        weekStart="2026-08-10"
        budgetLimitMinor={500_000}
        householdSize={4}
        plan={null}
        candidates={candidates}
        constraintDiagnostics={[
          {
            mealType: "dinner",
            currentCount: 1,
            timeLimitMinutes: 60,
            timeCandidateCount: 7,
            suggestedBudgetMinor: 600_000,
            budgetCandidateCount: 1,
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Improve your weekly variety" })).toBeInTheDocument();
    expect(screen.getByText(/1 matching meal\. Allowing up to 60 minutes unlocks 6 more/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Adjust dinner time" })).toHaveAttribute(
      "href",
      "/profile/edit?returnTo=%2Fmeal-plan%3Fweek%3D2026-08-10&step=kitchen#dinnerMinutes",
    );
  });
});
