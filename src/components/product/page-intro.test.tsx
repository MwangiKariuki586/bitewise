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
    expect(intro).toHaveClass("rounded-3xl", "py-5", "sm:py-8");
    expect(heading).toHaveClass("text-[2rem]", "sm:text-5xl");
  });
});
