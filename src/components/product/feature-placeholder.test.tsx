import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturePlaceholder } from "@/components/product/feature-placeholder";

describe("FeaturePlaceholder", () => {
  it("presents the primary task and accessible actions", () => {
    render(<FeaturePlaceholder eyebrow="Eat Now" title="Choose dinner" description="A practical shortlist." accent="Less guessing." />);

    expect(screen.getByRole("heading", { level: 1, name: "Choose dinner" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /set up your preferences/i })).toHaveAttribute("href", "/onboarding");
    expect(screen.getByRole("link", { name: /browse meal ideas/i })).toHaveAttribute("href", "/discover");
  });
});
