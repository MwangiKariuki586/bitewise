import { describe, expect, it } from "vitest";

import {
  eventCounts,
  isLocalSupabase,
  validatePassword,
} from "../../../scripts/recommendation-poc.mjs";

describe("recommendation POC utility", () => {
  it("requires a strong disposable password", () => {
    expect(() => validatePassword("Strong-Poc-Password9")).not.toThrow();
    expect(() => validatePassword("weak-password")).toThrow(/at least 12/);
  });

  it("requires explicit confirmation for hosted URLs", () => {
    expect(isLocalSupabase("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalSupabase("http://localhost:54321")).toBe(true);
    expect(isLocalSupabase("https://example.supabase.co")).toBe(false);
  });

  it("summarises persisted recommendation events", () => {
    expect(eventCounts([
      { event_type: "impression" },
      { event_type: "impression" },
      { event_type: "opened" },
    ])).toEqual({ impression: 2, opened: 1 });
  });
});
