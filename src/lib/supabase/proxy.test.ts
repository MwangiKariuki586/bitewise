import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClaims: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims: mocks.getClaims } }),
}));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key-long-enough",
  }),
  hasSupabaseEnv: () => true,
}));

import { updateSession } from "@/lib/supabase/proxy";

describe("Supabase session proxy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves a protected destination when authentication is required", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });
    const response = await updateSession(
      new NextRequest("https://bitewise.local/meal-plan?week=2026-08-10"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://bitewise.local/auth/sign-in?next=%2Fmeal-plan%3Fweek%3D2026-08-10",
    );
  });

  it("allows authenticated and public requests through", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-id" } }, error: null });
    const protectedResponse = await updateSession(
      new NextRequest("https://bitewise.local/eat-now"),
    );
    expect(protectedResponse.status).toBe(200);

    mocks.getClaims.mockResolvedValue({ data: null, error: null });
    const publicResponse = await updateSession(
      new NextRequest("https://bitewise.local/discover"),
    );
    expect(publicResponse.status).toBe(200);
  });
});
