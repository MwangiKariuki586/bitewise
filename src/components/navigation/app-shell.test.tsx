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

  it("expands only the active mobile destination into a labelled capsule", () => {
    mocks.pathname = "/discover";

    render(<AppShell accountMenu={<button type="button">Account</button>}>Discover</AppShell>);

    const mobileNavigation = screen.getAllByRole("navigation", { name: "Main navigation" })[1];
    const activeLink = within(mobileNavigation).getByRole("link", { name: "Discover" });
    const inactiveLink = within(mobileNavigation).getByRole("link", { name: "Eat Now" });

    expect(mobileNavigation).toHaveAttribute("data-slot", "bottom-navigation");
    expect(mobileNavigation).toHaveClass("flex", "rounded-[1.75rem]", "max-w-[30rem]");
    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(activeLink).toHaveClass("flex-1", "bg-primary", "text-primary-foreground");
    expect(within(activeLink).getByText("Discover")).not.toHaveClass("sr-only");
    expect(inactiveLink).toHaveClass("basis-11", "text-muted-foreground");
    expect(within(inactiveLink).getByText("Eat Now")).toHaveClass("sr-only");
  });

  it("keeps the same floating capsule treatment in active Cook Mode", () => {
    render(<AppShell accountMenu={<button type="button">Account</button>}>Cook details</AppShell>);

    const mobileNavigation = screen.getAllByRole("navigation", { name: "Main navigation" })[1];
    const activeLink = within(mobileNavigation).getByRole("link", { name: "Cook" });

    expect(mobileNavigation).toHaveClass("rounded-[1.75rem]", "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]");
    expect(activeLink).toHaveClass("flex-1", "bg-primary", "text-primary-foreground");
    expect(within(activeLink).getByText("Cook")).not.toHaveClass("sr-only");
  });
});
