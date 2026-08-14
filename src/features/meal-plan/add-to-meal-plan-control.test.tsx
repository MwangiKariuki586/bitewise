import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddToMealPlanControl } from "@/features/meal-plan/add-to-meal-plan-control";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  add: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/features/meal-plan/actions", () => ({
  getAddToMealPlanContextAction: (...args: unknown[]) => mocks.context(...args),
  addRecipeToMealPlanAction: (...args: unknown[]) => mocks.add(...args),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh, push: mocks.push }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.toast } }));

const context = {
  householdSize: 4,
  currentDayOfWeek: 2,
  mealTypes: ["lunch", "dinner"],
  weeks: [
    { weekStart: "2026-08-10", label: "This week", slots: [] },
    { weekStart: "2026-08-17", label: "Next week", slots: [{ dayOfWeek: 0, mealType: "lunch", recipeId: 9, recipeName: "Pilau" }] },
  ],
};

describe("AddToMealPlanControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.mockResolvedValue({ status: "success", data: context });
  });

  it("loads private planning context and defaults to household servings and today", async () => {
    const user = userEvent.setup();
    render(<AddToMealPlanControl authenticated recipeId={7} recipeName="Githeri" recipeSlug="githeri" />);

    await user.click(screen.getByRole("button", { name: "Add to meal plan" }));

    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(await screen.findByRole("spinbutton", { name: "Servings" })).toHaveValue(4);
    expect(screen.getByRole("button", { name: /Wed, 12 Aug/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Mon, 10 Aug/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Breakfast" })).not.toBeInTheDocument();
  });

  it("requires confirmation before replacing an occupied slot", async () => {
    const user = userEvent.setup();
    mocks.add.mockResolvedValue({ status: "success", data: { weekStart: "2026-08-17", dayOfWeek: 0, mealType: "lunch" } });
    render(<AddToMealPlanControl authenticated recipeId={7} recipeName="Githeri" recipeSlug="githeri" />);
    await user.click(screen.getByRole("button", { name: "Add to meal plan" }));
    await screen.findByRole("dialog");
    await user.click(await screen.findByRole("button", { name: "Next week" }));

    expect(screen.getByText(/already has Pilau/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Review replacement" }));
    expect(mocks.add).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Replace meal" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Replace meal" }));

    await waitFor(() => expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ expectedRecipeId: 9, replaceConfirmed: true })));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
  });
});
