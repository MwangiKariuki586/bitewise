import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WatchCookPanel } from "@/features/watch-cook/watch-cook-panel";

describe("WatchCookPanel", () => {
  it("updates a disclosed external search link from the selected preferences", () => {
    render(
      <WatchCookPanel
        recipeName="Githeri"
        recipeMinutes={55}
        recipeSkill="moderate"
        suggestedEquipment={["gas_cooker"]}
        dietaryTags={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tutorial language"), {
      target: { value: "swahili" },
    });
    fireEvent.change(screen.getByLabelText("Maximum video time"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByLabelText("Vegan"));

    const link = screen.getByRole("link", { name: /search youtube tutorials/i });
    const url = new URL(link.getAttribute("href") ?? "");
    expect(url.searchParams.get("search_query")).toContain("Kiswahili 30 minutes");
    expect(url.searchParams.get("search_query")).toContain("vegan");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText(/has not reviewed or endorsed/i)).toBeVisible();
  });
});
