import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecipePersonalisationControls } from "@/features/personalisation/controls";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
const navigationMocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("@/features/personalisation/actions", () => ({
  mutateRecipePersonalisationAction: (input: unknown) => mocks.mutate(input),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigationMocks.push, refresh: navigationMocks.refresh }),
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

  it("attributes recommendation feedback to its originating run", async () => {
    mocks.mutate.mockResolvedValueOnce({ status: "success", message: "Saved", data: { feedback: "liked", isSaved: false, lastEatenAt: null } });
    render(<RecipePersonalisationControls recommendationRunId="10000000-0000-4000-8000-000000000001" recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    fireEvent.click(screen.getByRole("button", { name: "Like" }));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith({
      operation: "like",
      recipeId: 7,
      recommendationRunId: "10000000-0000-4000-8000-000000000001",
    }));
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

  it("keeps selected card actions neutral and marks only their icons with the primary colour", () => {
    const { rerender } = render(<RecipePersonalisationControls cardActions recipeId={7} authenticated initialState={{ feedback: "liked", isSaved: true, lastEatenAt: null }} />);

    const likeButton = screen.getByRole("button", { name: "Like" });
    const saveButton = screen.getByRole("button", { name: "Saved" });
    expect(likeButton).toHaveClass("border", "bg-background/80", "text-foreground");
    expect(likeButton).toHaveClass("gap-1", "px-2");
    expect(likeButton).not.toHaveClass("bg-primary", "text-primary-foreground");
    expect(likeButton.querySelector("svg")).toHaveClass("shrink-0", "fill-current", "text-primary");
    expect(likeButton.querySelector("svg")).toHaveAttribute("fill", "currentColor");
    expect(saveButton).toHaveClass("border", "bg-background/80", "text-foreground");
    expect(saveButton).not.toHaveClass("bg-primary", "bg-secondary");
    expect(saveButton.querySelector("svg")).toHaveClass("shrink-0", "fill-current", "text-primary");

    rerender(<RecipePersonalisationControls key="disliked" cardActions recipeId={7} authenticated initialState={{ feedback: "disliked", isSaved: false, lastEatenAt: null }} />);

    const dislikeButton = screen.getByRole("button", { name: "Dislike" });
    expect(dislikeButton).toHaveClass("border", "bg-background/80", "text-foreground");
    expect(dislikeButton).toHaveClass("gap-1", "px-2");
    expect(dislikeButton).not.toHaveClass("bg-primary", "text-primary-foreground");
    expect(dislikeButton.querySelector("svg")).toHaveClass("shrink-0", "fill-current", "text-primary");
    expect(dislikeButton.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  });

  it("keeps save, feedback, and eaten actions inside the recipe overflow menu", () => {
    render(<RecipePersonalisationControls detailActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: "2026-08-14T10:00:00Z" }} />);

    fireEvent.click(screen.getByLabelText("More recipe actions"));
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dislike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark as eaten again" })).toBeInTheDocument();
  });

  it("opens recipe actions for guests and redirects only after an action is selected", () => {
    mocks.mutate.mockClear();
    navigationMocks.push.mockClear();
    render(<RecipePersonalisationControls detailActions recipeId={7} authenticated={false} returnTo="/recipes/githeri" initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    const trigger = screen.getByLabelText("More recipe actions");
    expect(trigger).toHaveClass("size-11");
    expect(screen.queryByText("Sign in to save")).not.toBeInTheDocument();
    expect(navigationMocks.push).not.toHaveBeenCalled();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(navigationMocks.push).toHaveBeenCalledWith("/auth/sign-in?next=%2Frecipes%2Fgitheri");
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it("shows visible selected feedback in the recipe overflow menu", async () => {
    mocks.mutate.mockResolvedValueOnce({ status: "success", message: "Saved", data: { feedback: "liked", isSaved: false, lastEatenAt: null } });
    render(<RecipePersonalisationControls detailActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    fireEvent.click(screen.getByLabelText("More recipe actions"));
    fireEvent.click(screen.getByRole("button", { name: "Like" }));

    fireEvent.click(screen.getByLabelText("More recipe actions"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Unlike" })).toHaveAttribute("aria-pressed", "true"));
  });

  it("closes the recipe overflow menu on outside click and Escape", () => {
    render(<RecipePersonalisationControls detailActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    const trigger = screen.getByLabelText("More recipe actions");
    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "Recipe actions" })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu", { name: "Recipe actions" })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Recipe actions" })).not.toBeInTheDocument();
  });

  it("closes the recommendation-card overflow menu on outside click", () => {
    render(<RecipePersonalisationControls cardActions recipeId={7} authenticated initialState={{ feedback: null, isSaved: false, lastEatenAt: null }} />);

    fireEvent.click(screen.getByLabelText("More meal actions"));
    expect(screen.getByRole("menu", { name: "Meal actions" })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu", { name: "Meal actions" })).not.toBeInTheDocument();
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

    screen.getAllByLabelText("More recipe actions").forEach((trigger) => fireEvent.click(trigger));
    fireEvent.click(screen.getAllByRole("button", { name: "Like" })[0]);

    fireEvent.mouseDown(document.body);
    screen.getAllByLabelText("More recipe actions").forEach((trigger) => fireEvent.click(trigger));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Unlike" })).toHaveLength(2));
    const stored = JSON.parse(sessionStorage.getItem("bitewise:eat-now-state") ?? "{}");
    expect(stored.result.data.meals[0].personalisation.feedback).toBe("liked");
    expect(navigationMocks.refresh).toHaveBeenCalled();
  });
});
