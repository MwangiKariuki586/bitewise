import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AccountMenu, accountInitials } from "@/components/navigation/account-menu";

vi.mock("@/features/auth/actions", () => ({ signOutAction: vi.fn() }));

describe("AccountMenu", () => {
  it("derives concise initials from names and email fallbacks", () => {
    expect(accountInitials({ displayName: "Wanjiku Kamau", email: null })).toBe("WK");
    expect(accountInitials({ displayName: "Amina", email: null })).toBe("AM");
    expect(accountInitials({ displayName: null, email: "jane-doe@example.com" })).toBe("JD");
  });

  it("opens an accessible profile card with account actions", async () => {
    const user = userEvent.setup();
    render(<AccountMenu displayName="Wanjiku Kamau" email="wanjiku@example.com" />);

    const trigger = screen.getByRole("button", {
      name: "Open account menu for Wanjiku Kamau",
    });
    expect(trigger).toHaveTextContent("WK");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Account menu" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: "Edit preferences" })).toHaveAttribute(
      "href",
      "/onboarding?returnTo=/profile",
    );
    expect(screen.getByRole("link", { name: "Saved meals" })).toHaveAttribute(
      "href",
      "/my-kitchen/saved",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Account menu" })).not.toBeInTheDocument();
  });
});
