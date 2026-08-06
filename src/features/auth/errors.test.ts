import { describe, expect, it } from "vitest";

import { isEmailSendRateLimit } from "@/features/auth/errors";

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
});
