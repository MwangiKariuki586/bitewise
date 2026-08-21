import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getPaginationItems, Pagination } from "@/components/ui/pagination";

describe("Pagination", () => {
  it("builds the expected ranges for the start, middle, and end", () => {
    expect(getPaginationItems(3, 12)).toEqual([1, 2, 3, 4, "ellipsis", 12]);
    expect(getPaginationItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
    expect(getPaginationItems(12, 12)).toEqual([1, 2, "ellipsis", 10, 11, 12]);
  });

  it("links available destinations and exposes the current and disabled states", () => {
    render(<Pagination currentPage={12} totalPages={12} getHref={(page) => `/recipes?page=${page}`} ariaLabel="Recipe pages" />);

    expect(screen.getByRole("navigation", { name: "Recipe pages" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/recipes?page=11");
    expect(screen.getByText("12 of 12")).toBeInTheDocument();
    expect(screen.getByLabelText("Page 12, current page")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Next").closest("span")).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
  });
});
