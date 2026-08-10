import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ShoppingListItemRow } from "@/features/shopping-list/shopping-list-item";

vi.mock("@/features/shopping-list/actions", () => ({
  mutateShoppingListItemAction: vi.fn(),
}));

describe("ShoppingListItemRow", () => {
  it("exposes accessible check, edit, and delete actions", async () => {
    const user = userEvent.setup();
    render(
      <ShoppingListItemRow
        shoppingListId={4}
        item={{
          estimatedCostMinor: 24_500,
          id: 9,
          isChecked: false,
          name: "Rice",
          quantity: 2,
          source: "generated",
          unit: "kg",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Mark Rice as bought" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Delete Rice" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /Edit Rice/ }));
    expect(screen.getByLabelText("Quantity for Rice")).toHaveValue(2);
    expect(screen.getByLabelText("Estimated cost for Rice (KES)")).toHaveValue(245);
    expect(screen.queryByLabelText("Item name")).not.toBeInTheDocument();
  });

  it("allows manual item names and units to be edited", async () => {
    const user = userEvent.setup();
    render(
      <ShoppingListItemRow
        shoppingListId={4}
        item={{
          estimatedCostMinor: 10_000,
          id: 10,
          isChecked: true,
          name: "Dish soap",
          quantity: 1,
          source: "manual",
          unit: "piece",
        }}
      />,
    );
    expect(screen.getByRole("button", { name: "Move Dish soap back to buy" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Edit Dish soap/ }));
    expect(screen.getByLabelText("Item name")).toHaveValue("Dish soap");
    expect(screen.getByLabelText("Unit for Dish soap")).toHaveValue("piece");
  });
});
