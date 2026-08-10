import { describe, expect, it } from "vitest";

import { personalisationOperationSchema } from "@/features/personalisation/schemas";

describe("personalisationOperationSchema", () => {
  it("accepts a supported owned mutation", () => {
    expect(
      personalisationOperationSchema.parse({ recipeId: 4, operation: "save" }),
    ).toEqual({ recipeId: 4, operation: "save" });
  });

  it("rejects arbitrary operations", () => {
    expect(
      personalisationOperationSchema.safeParse({ recipeId: 4, operation: "publish" })
        .success,
    ).toBe(false);
  });
});
