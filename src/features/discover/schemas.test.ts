import { describe, expect, it } from "vitest";

import { discoverSearchSchema } from "@/features/discover/schemas";

describe("discoverSearchSchema", () => {
  it("normalizes public search parameters", () => {
    expect(
      discoverSearchSchema.parse({
        q: "  chapati ",
        equipment: ["gas_cooker", "blender"],
        diet: "vegan",
        maxCostKes: "250",
        page: "2",
      }),
    ).toEqual({
      q: "chapati",
      ingredient: undefined,
      maxMinutes: undefined,
      maxCostKes: 250,
      equipment: ["gas_cooker", "blender"],
      diet: ["vegan"],
      cuisine: undefined,
      skill: undefined,
      page: 2,
    });
  });

  it("rejects unbounded and unknown filters", () => {
    expect(
      discoverSearchSchema.safeParse({
        maxMinutes: "999",
        equipment: "campfire",
      }).success,
    ).toBe(false);
  });
});
