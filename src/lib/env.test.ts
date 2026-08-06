import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicEnv, getServerEnv, hasSupabaseEnv } from "@/lib/env";

describe("environment validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports missing Supabase configuration without exposing values", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(hasSupabaseEnv()).toBe(false);
    expect(() => getPublicEnv()).toThrow("Supabase is not configured");
  });

  it("accepts valid public and server-only configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://bitewise.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_12345678901234567890");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-12345678901234567890");
    vi.stubEnv("RATE_LIMIT_HASH_KEY", "12345678901234567890123456789012");

    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe("https://bitewise.supabase.co");
    expect(getServerEnv().RATE_LIMIT_HASH_KEY).toHaveLength(32);
  });
});
