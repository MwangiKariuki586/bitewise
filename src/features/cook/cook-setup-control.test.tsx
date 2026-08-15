import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CookSetupControl } from "@/features/cook/cook-setup-control";

const mocks = vi.hoisted(() => ({
  context: vi.fn(),
  push: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/features/cook/actions", () => ({
  getCookSetupContextAction: (...args: unknown[]) => mocks.context(...args),
}));
vi.mock("@/features/cook/start-session-form", () => ({
  StartSessionForm: ({ defaultServings, submitLabel }: { defaultServings: number; submitLabel: string }) => (
    <form>
      <label>Servings<input type="number" defaultValue={defaultServings} /></label>
      <button type="submit">{submitLabel}</button>
    </form>
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("sonner", () => ({ toast: { error: mocks.toast } }));

describe("CookSetupControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.mockResolvedValue({
      status: "success",
      data: { householdSize: 4, hasActiveSession: false },
    });
  });

  it("opens an in-place serving picker using household size", async () => {
    const user = userEvent.setup();
    render(
      <CookSetupControl
        authenticated
        recipeId={16}
        recipeName="Sweet Potato with Boiled Eggs"
        recipeSlug="sweet-potato-boiled-eggs"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start cooking" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveClass("bottom-0", "sm:top-1/2");
    expect(screen.getByRole("heading", { name: "Start cooking Sweet Potato with Boiled Eggs" })).toBeVisible();
    expect(screen.getByRole("spinbutton", { name: "Servings" })).toHaveValue(4);
    expect(screen.getByRole("button", { name: "Begin cooking" })).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("resumes an active session without opening the setup", async () => {
    const user = userEvent.setup();
    mocks.context.mockResolvedValue({
      status: "success",
      data: { householdSize: 4, hasActiveSession: true },
    });
    render(
      <CookSetupControl
        authenticated
        recipeId={16}
        recipeName="Sweet Potato with Boiled Eggs"
        recipeSlug="sweet-potato-boiled-eggs"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Start cooking" }));

    expect(mocks.push).toHaveBeenCalledWith("/cook/16");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("preserves the recipe route through signed-out authentication", () => {
    render(
      <CookSetupControl
        authenticated={false}
        recipeId={16}
        recipeName="Sweet Potato with Boiled Eggs"
        recipeSlug="sweet-potato-boiled-eggs"
      />,
    );

    expect(screen.getByRole("link", { name: "Start cooking" })).toHaveAttribute(
      "href",
      "/auth/sign-in?next=%2Frecipes%2Fsweet-potato-boiled-eggs",
    );
  });
});
