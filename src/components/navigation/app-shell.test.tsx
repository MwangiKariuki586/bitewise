import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/navigation/app-shell";

const mocks = vi.hoisted(() => ({ pathname: "/cook/21" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

describe("AppShell", () => {
  beforeEach(() => {
    mocks.pathname = "/cook/21";
  });

  it("removes the outer page gutter for Cook details", () => {
    render(<AppShell accountMenu={<button type="button">Account</button>}>Cook details</AppShell>);

    expect(screen.getByRole("main")).toHaveClass("max-w-none", "px-0", "pt-0");
    expect(screen.getByRole("main")).not.toHaveClass("px-4", "sm:px-6", "lg:px-8");
  });

  it("preserves the shared sidebar on Cook details", () => {
    render(<AppShell accountMenu={<button type="button">Account</button>}>Cook details</AppShell>);

    const sidebar = screen.getByRole("complementary", { name: "BiteWise navigation" });
    expect(sidebar.parentElement).toHaveClass("lg:grid-cols-[17rem_minmax(0,1fr)]");
    expect(within(sidebar).getByText("Eat well, wisely")).toBeVisible();
    expect(within(sidebar).getByText("Made for real kitchens")).toBeVisible();
    expect(within(sidebar).queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Cook" })).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("keeps the shared gutter on other product routes", () => {
    mocks.pathname = "/discover";

    render(<AppShell accountMenu={<button type="button">Account</button>}>Discover</AppShell>);

    expect(screen.getByRole("main")).toHaveClass("max-w-[92rem]", "px-4", "sm:px-6", "lg:px-8");
  });
});
