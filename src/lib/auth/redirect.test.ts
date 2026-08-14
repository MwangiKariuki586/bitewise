import { describe, expect, it } from "vitest";

import {
  authPath,
  postAuthenticationPath,
  safeLocalPath,
  safeReturnPath,
} from "@/lib/auth/redirect";

describe("authentication return paths", () => {
  it("accepts known local destinations and rejects unsafe redirects", () => {
    expect(safeReturnPath("/meal-plan?week=2026-08-10")).toBe(
      "/meal-plan?week=2026-08-10",
    );
    expect(safeReturnPath("/recipes/githeri")).toBe("/recipes/githeri");
    expect(safeReturnPath("https://example.com/meal-plan")).toBeNull();
    expect(safeReturnPath("//example.com/meal-plan")).toBeNull();
    expect(safeReturnPath("/auth/sign-in")).toBeNull();
    expect(safeLocalPath("/auth/update-password?next=%2Feat-now")).toBe(
      "/auth/update-password?next=%2Feat-now",
    );
  });

  it("returns completed profiles to the requested action", () => {
    expect(postAuthenticationPath("/my-kitchen/saved?page=2", true)).toBe(
      "/my-kitchen/saved?page=2",
    );
    expect(postAuthenticationPath(null, true)).toBe("/eat-now");
  });

  it("finishes onboarding before resuming an incomplete profile", () => {
    expect(postAuthenticationPath("/meal-plan", false)).toBe(
      "/onboarding?returnTo=%2Fmeal-plan",
    );
    expect(postAuthenticationPath("/onboarding", false)).toBe("/onboarding");
  });

  it("encodes the destination in auth links", () => {
    expect(authPath("/auth/sign-in", "/recipes/githeri")).toBe(
      "/auth/sign-in?next=%2Frecipes%2Fgitheri",
    );
  });
});
