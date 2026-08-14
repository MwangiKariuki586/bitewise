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

  it("preserves the requested destination through sign-in and recovery", async () => {
    const user = userEvent.setup();
    const destinationAction = vi.fn<
      (state: ActionResult, formData: FormData) => Promise<ActionResult>
    >(
      async (): Promise<ActionResult> => ({
        status: "error",
        message: "Test response",
      }),
    );
    render(
      <AuthForm
        action={destinationAction}
        mode="sign-in"
        nextPath="/meal-plan?week=2026-08-10"
      />,
    );

    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/auth/forgot-password?next=%2Fmeal-plan%3Fweek%3D2026-08-10",
    );
    await user.type(screen.getByLabelText("Email address"), "amina@example.com");
    await user.type(screen.getByLabelText("Password"), "Secret#42");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const submittedForm = destinationAction.mock.calls[0]?.[1];
    expect(submittedForm).toBeInstanceOf(FormData);
    expect(submittedForm?.get("next")).toBe("/meal-plan?week=2026-08-10");
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
