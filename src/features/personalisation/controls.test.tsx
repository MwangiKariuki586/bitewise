import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecipePersonalisationControls } from "@/features/personalisation/controls";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/features/personalisation/actions", () => ({
  mutateRecipePersonalisationAction: (input: unknown) => mocks.mutate(input),
}));

describe("RecipePersonalisationControls", () => {
  it("supports like and undo with one selected state", async () => {
    mocks.mutate
      .mockResolvedValueOnce({ status: "success", message: "Saved", data: { feedback: "liked", isSaved: false, lastEatenAt: null } })
      .mockResolvedValueOnce({ status: "success", message: "Saved", data: { feedback: null, isSaved: false, lastEatenAt: null } });
    render(<RecipePersonalisationControls recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Like" })).toHaveAttribute("aria-pressed", "true"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Like" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    await waitFor(() => expect(mocks.mutate).toHaveBeenLastCalledWith({ recipeId: 7, operation: "undo_feedback" }));
  });

  it("offers authentication instead of mutating for a guest", () => {
    render(<RecipePersonalisationControls recipeId={7} authenticated={false} returnTo="/recipes/githeri" initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);
    expect(screen.getByRole("link", { name: "Sign in to save" })).toHaveAttribute(
      "href",
      "/auth/sign-in?next=%2Frecipes%2Fgitheri",
    );
  });
});
