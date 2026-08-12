import { describe, expect, it } from "vitest";

import {
  authErrorMessage,
  isEmailSendRateLimit,
} from "@/features/auth/errors";

describe("Supabase auth error classification", () => {
  it("recognizes the hosted email send limit by error code", () => {
    expect(
      isEmailSendRateLimit({ code: "over_email_send_rate_limit", status: 429 }),
    ).toBe(true);
  });

  it("does not misclassify unrelated authentication errors", () => {
    expect(isEmailSendRateLimit({ code: "email_exists", status: 422 })).toBe(
      false,
    );
  });

  it("gives sign-in failures a clear next step", () => {
    expect(authErrorMessage({ code: "invalid_credentials" }, "sign-in")).toBe(
      "The email or password is incorrect. Check both and try again.",
    );
    expect(authErrorMessage({ code: "email_not_confirmed" }, "sign-in")).toContain(
      "Confirm your email",
    );
  });

  it("distinguishes common account-creation failures", () => {
    expect(authErrorMessage({ code: "user_already_exists" }, "sign-up")).toContain(
      "already uses this email",
    );
    expect(authErrorMessage({ code: "weak_password" }, "sign-up")).toContain(
      "stronger password",
    );
  });
});
