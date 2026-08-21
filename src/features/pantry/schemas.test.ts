import { describe, expect, it } from "vitest";

import { normalizePantryFilterConflicts, pantryItemSchema, pantryItemUpdateSchema, pantryQuerySchema, restrictPantryDeveloperFilters } from "@/features/pantry/schemas";

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

  it("requires a positive quantity when adding an ingredient", () => {
    expect(pantryItemSchema.safeParse({ ingredientId: 1, quantity: "", unit: "piece", expiryDate: "", notes: "" }).success).toBe(false);
    expect(pantryItemSchema.safeParse({ ingredientId: 1, quantity: 0, unit: "piece", expiryDate: "", notes: "" }).success).toBe(false);
    expect(pantryItemSchema.safeParse({ ingredientId: 1, quantity: -1, unit: "piece", expiryDate: "", notes: "" }).success).toBe(false);
    expect(pantryItemSchema.safeParse({ ingredientId: 1, quantity: 1, unit: "sack", expiryDate: "", notes: "" }).success).toBe(false);
  });

  it("allows an existing pantry item to be marked out of stock but not left blank", () => {
    expect(pantryItemUpdateSchema.safeParse({ ingredientId: 1, quantity: 0, unit: "piece", expiryDate: "", notes: "" }).success).toBe(true);
    expect(pantryItemUpdateSchema.safeParse({ ingredientId: 1, quantity: "", unit: "piece", expiryDate: "", notes: "" }).success).toBe(false);
  });

  it("normalizes empty optional fields and unsafe pagination", () => {
    const item = pantryItemSchema.parse({ ingredientId: 1, quantity: 2, unit: "piece", expiryDate: "", notes: "" });
    const query = pantryQuerySchema.parse({ page: "-4", search: " tomato " });
    expect(item.expiryDate).toBeNull();
    expect(item.notes).toBeNull();
    expect(query).toEqual({
      category: "all",
      edit: undefined,
      expiry: "any",
      page: 1,
      search: "tomato",
      showArchived: false,
      showZero: false,
      sort: "expiry-soon",
      status: "all",
    });
  });

  it("normalizes supported pantry filters and ignores unsupported values", () => {
    expect(pantryQuerySchema.parse({
      category: "produce",
      expiry: "7-days",
      showArchived: "true",
      showZero: "true",
      sort: "quantity-high",
      status: "use-soon",
    })).toMatchObject({
      category: "produce",
      expiry: "7-days",
      showArchived: true,
      showZero: true,
      sort: "quantity-high",
      status: "use-soon",
    });
    expect(pantryQuerySchema.parse({ category: "unsafe", status: "expired" })).toMatchObject({ category: "all", status: "all" });
  });

  it("disables developer inventory filters in production mode", () => {
    const query = pantryQuerySchema.parse({ showArchived: "true", showZero: "true" });

    expect(restrictPantryDeveloperFilters(query, true)).toMatchObject({ showArchived: true, showZero: true });
    expect(restrictPantryDeveloperFilters(query, false)).toMatchObject({ showArchived: false, showZero: false });
  });

  it("normalizes mutually exclusive status and expiry filters", () => {
    const noExpiryWithWindow = pantryQuerySchema.parse({ status: "no-expiry", expiry: "7-days" });
    const useSoonWithoutExpiry = pantryQuerySchema.parse({ status: "use-soon", expiry: "no-expiry" });
    const useSoonWithShorterWindow = pantryQuerySchema.parse({ status: "use-soon", expiry: "3-days" });

    expect(normalizePantryFilterConflicts(noExpiryWithWindow)).toMatchObject({ status: "no-expiry", expiry: "any" });
    expect(normalizePantryFilterConflicts(useSoonWithoutExpiry)).toMatchObject({ status: "use-soon", expiry: "any" });
    expect(normalizePantryFilterConflicts(useSoonWithShorterWindow)).toMatchObject({ status: "use-soon", expiry: "any" });
  });
});
