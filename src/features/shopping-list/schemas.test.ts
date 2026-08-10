import { describe, expect, it } from "vitest";

import {
  generateShoppingListSchema,
  shoppingListMutationSchema,
  shoppingListPageSchema,
} from "@/features/shopping-list/schemas";

describe("shopping list validation", () => {
  it("validates plan IDs and safe pagination", () => {
    expect(generateShoppingListSchema.safeParse({ mealPlanId: "42" }).success).toBe(true);
    expect(generateShoppingListSchema.safeParse({ mealPlanId: "0" }).success).toBe(false);
    expect(shoppingListPageSchema.parse({ page: "not-a-page" }).page).toBe(1);
  });

  it("converts manual KES estimates to integer minor units", () => {
    const result = shoppingListMutationSchema.safeParse({
      shoppingListId: "7",
      operation: "add",
      name: "Dish soap",
      quantity: "2",
      unit: "piece",
      estimatedCostMinor: "249.50",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.estimatedCostMinor).toBe(24_950);
  });

  it("requires operation-specific item and checked values", () => {
    expect(shoppingListMutationSchema.safeParse({
      shoppingListId: "7",
      operation: "delete",
    }).success).toBe(false);
    expect(shoppingListMutationSchema.safeParse({
      shoppingListId: "7",
      operation: "toggle",
      itemId: "9",
      isChecked: "true",
    }).success).toBe(true);
  });
});
