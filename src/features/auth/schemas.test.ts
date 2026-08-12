import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas";

describe("authentication validation", () => {
  it("normalizes valid registration details", () => {
    const result = signUpSchema.parse({
      name: "  Amina  ",
      email: "  AMINA@example.com ",
      password: "Chapati#42",
      confirmPassword: "Chapati#42",
    });

    expect(result).toEqual({
      name: "Amina",
      email: "amina@example.com",
      password: "Chapati#42",
      confirmPassword: "Chapati#42",
    });
  });

  it("rejects weak registration passwords", () => {
    const result = signUpSchema.safeParse({
      name: "Amina",
      email: "amina@example.com",
      password: "password",
      confirmPassword: "password",
    });

    expect(result.success).toBe(false);
  });

  it("requires matching replacement passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "Ugali#2026",
      confirmPassword: "Ugali#2027",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
        "Passwords do not match.",
      );
    }
  });

  it("accepts sign-in and reset emails without weakening password rules", () => {
    expect(
      signInSchema.safeParse({
        email: "user@example.com",
        password: "x",
      }).success,
    ).toBe(true);
    expect(
      forgotPasswordSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });
});
