import { describe, expect, it } from "vitest";

import { pantryItemSchema, pantryQuerySchema } from "@/features/pantry/schemas";

describe("pantry validation", () => {
  it("accepts canonical quantities, units, and optional expiry", () => {
    const result = pantryItemSchema.parse({
      ingredientId: "12",
      quantity: "1.5",
      unit: "kg",
      expiryDate: "2026-08-12",
      notes: "  unopened  ",
    });
    expect(result).toMatchObject({ ingredientId: 12, quantity: 1.5, unit: "kg", notes: "unopened" });
  });

  it("rejects unknown units and non-positive quantities", () => {
    expect(pantryItemSchema.safeParse({ ingredientId: 1, quantity: 0, unit: "sack", expiryDate: "", notes: "" }).success).toBe(false);
  });

  it("normalizes empty optional fields and unsafe pagination", () => {
    const item = pantryItemSchema.parse({ ingredientId: 1, quantity: 2, unit: "piece", expiryDate: "", notes: "" });
    const query = pantryQuerySchema.parse({ page: "-4", search: " tomato " });
    expect(item.expiryDate).toBeNull();
    expect(item.notes).toBeNull();
    expect(query).toEqual({ page: 1, search: "tomato" });
  });
});
