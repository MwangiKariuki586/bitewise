import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecipePersonalisationControls } from "@/features/personalisation/controls";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
const navigationMocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("@/features/personalisation/actions", () => ({
  mutateRecipePersonalisationAction: (input: unknown) => mocks.mutate(input),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: navigationMocks.refresh }),
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

  it("uses compact save and overflow actions on recommendation cards", () => {
    render(<RecipePersonalisationControls cardActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
    expect(screen.getByLabelText("More meal actions")).toBeVisible();
    expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dislike" })).toBeInTheDocument();
  });

  it("keeps save, feedback, and eaten actions inside the recipe overflow menu", () => {
    render(<RecipePersonalisationControls detailActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: "2026-08-14T10:00:00Z" }} />);

    expect(screen.getByLabelText("More recipe actions")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dislike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark as eaten again" })).toBeInTheDocument();
  });

  it("shows visible selected feedback in the recipe overflow menu", async () => {
    mocks.mutate.mockResolvedValueOnce({ status: "success", message: "Saved", data: { feedback: "liked", isSaved: false, lastEatenAt: null } });
    render(<RecipePersonalisationControls detailActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    fireEvent.click(screen.getByRole("button", { name: "Like" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Unlike" })).toHaveAttribute("aria-pressed", "true"));
  });

  it("synchronises matching controls and the stored Eat Now card state", async () => {
    sessionStorage.setItem("bitewise:eat-now-state", JSON.stringify({
      version: 1,
      result: { status: "success", data: { meals: [{ id: 7, personalisation: { feedback: null, isSaved: false, lastEatenAt: null } }] } },
      constraints: {},
      sort: "best",
      scrollY: 0,
    }));
    mocks.mutate.mockResolvedValueOnce({ status: "success", message: "Saved", data: { feedback: "liked", isSaved: false, lastEatenAt: null } });
    render(<>
      <RecipePersonalisationControls detailActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />
      <RecipePersonalisationControls detailActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />
    </>);

    fireEvent.click(screen.getAllByRole("button", { name: "Like" })[0]);

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Unlike" })).toHaveLength(2));
    const stored = JSON.parse(sessionStorage.getItem("bitewise:eat-now-state") ?? "{}");
    expect(stored.result.data.meals[0].personalisation.feedback).toBe("liked");
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });
});
