import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageIntro } from "@/components/product/page-intro";

describe("PageIntro", () => {
  it("keeps app-page context compact and semantically clear", () => {
    render(
      <PageIntro
        eyebrow="Eat Now"
        title="A confident meal decision, in minutes."
        description="Compare practical meals against today's constraints."
      />,
    );

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "A confident meal decision, in minutes.",
    });
    const intro = heading.closest("[data-slot='page-intro']");

    expect(screen.getByText("Eat Now")).toBeInTheDocument();
    expect(screen.getByText("Compare practical meals against today's constraints.")).toBeInTheDocument();
    expect(intro).toHaveAttribute("data-variant", "compact");
    expect(intro).toHaveClass("rounded-3xl", "py-4", "sm:py-6");
    expect(heading).toHaveClass("text-[1.85rem]", "sm:text-4xl");
  });

  it("uses a lighter utility intro without the solid brand surface", () => {
    render(
      <PageIntro
        eyebrow="Discover"
        title="Find something good."
        description="Search by ingredient, time, or budget."
        variant="standard"
      />,
    );

    const intro = screen.getByRole("heading", { level: 1 }).closest("[data-slot='page-intro']");
    expect(intro).toHaveAttribute("data-variant", "standard");
    expect(intro).not.toHaveClass("bg-primary");
  });
});
