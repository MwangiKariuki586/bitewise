import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DiscoverSearchCard } from "@/features/discover/search-card";

describe("DiscoverSearchCard", () => {
  it("links a public result to its recipe and exposes decision details", () => {
    render(
      <DiscoverSearchCard
        recipe={{
          id: 1,
          slug: "githeri",
          name: "Githeri",
          summary: "A filling maize and bean meal for an everyday Kenyan kitchen.",
          cuisine: "kenyan",
          mealTypes: ["lunch"],
          baseServings: 4,
          totalMinutes: 55,
          difficulty: "easy",
          requiredEquipment: [],
          dietaryTags: ["vegan"],
          estimatedCostMinor: 40_000,
          estimatedCostPerServingMinor: 10_000,
          costCapturedOn: "2026-08-01",
          image: null,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /githeri/i })).toHaveAttribute(
      "href",
      "/recipes/githeri",
    );
    expect(screen.getByText("55 min")).toBeVisible();
    expect(screen.getByText("KES 100 ingredients/serving")).toBeVisible();
    expect(screen.getByText("easy")).toBeVisible();
    expect(screen.queryByText(/filling maize and bean meal/i)).not.toBeInTheDocument();
  });
});
