import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/features/auth/auth-form";
import type { ActionResult } from "@/lib/action-result";

const action = vi.fn(async (): Promise<ActionResult> => ({ status: "idle" }));

describe("AuthForm password controls", () => {
  it("lets sign-in users reveal and hide their password", async () => {
    const user = userEvent.setup();
    render(<AuthForm action={action} mode="sign-in" />);

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    expect(screen.queryByLabelText("Confirm password")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("includes password confirmation when creating an account", () => {
    render(<AuthForm action={action} mode="sign-up" />);

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("preserves every entry when account creation returns an error", async () => {
    const user = userEvent.setup();
    const failingAction = vi.fn(async (): Promise<ActionResult> => ({
      status: "error",
      message: "An account already uses this email.",
    }));
    render(<AuthForm action={failingAction} mode="sign-up" />);

    await user.type(screen.getByLabelText("Your name"), "Amina");
    await user.type(screen.getByLabelText("Email address"), "amina@example.com");
    await user.type(screen.getByLabelText("Password"), "Chapati#42");
    await user.type(screen.getByLabelText("Confirm password"), "Chapati#42");
    await user.click(screen.getByRole("button", { name: "Create my account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account already uses this email.",
    );
    expect(screen.getByLabelText("Your name")).toHaveValue("Amina");
    expect(screen.getByLabelText("Email address")).toHaveValue("amina@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("Chapati#42");
    expect(screen.getByLabelText("Confirm password")).toHaveValue("Chapati#42");
  });
});
