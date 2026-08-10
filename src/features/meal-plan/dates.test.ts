import { describe, expect, it } from "vitest";

import {
  currentWeekStart,
  formatWeekRange,
  shiftWeek,
} from "@/features/meal-plan/dates";

describe("meal plan week dates", () => {
  it("uses the Nairobi calendar day when selecting the current Monday", () => {
    expect(currentWeekStart(new Date("2026-08-09T22:30:00Z"))).toBe("2026-08-10");
  });

  it("shifts whole weeks and formats a concise range", () => {
    expect(shiftWeek("2026-08-10", -1)).toBe("2026-08-03");
    expect(shiftWeek("2026-08-10", 1)).toBe("2026-08-17");
    expect(formatWeekRange("2026-08-10")).toContain("2026");
  });
});
