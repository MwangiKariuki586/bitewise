import { describe, expect, it } from "vitest";

import { buildYouTubeTutorialSearchUrl } from "@/features/watch-cook/youtube-search";

describe("buildYouTubeTutorialSearchUrl", () => {
  it("encodes every selected tutorial preference without calling an API", () => {
    const url = new URL(
      buildYouTubeTutorialSearchUrl({
        recipeName: "Soft chapati",
        language: "swahili",
        maxMinutes: 30,
        skill: "easy",
        equipment: "gas_cooker",
        dietaryTerms: ["dairy_free"],
      }),
    );

    expect(url.origin).toBe("https://www.youtube.com");
    expect(url.pathname).toBe("/results");
    expect(url.searchParams.get("search_query")).toBe(
      "Soft chapati recipe tutorial Kiswahili 30 minutes or less easy cooking using gas cooker dairy free",
    );
  });

  it("uses English and omits unavailable optional terms", () => {
    const url = new URL(
      buildYouTubeTutorialSearchUrl({
        recipeName: " Githeri ",
        language: "english",
        maxMinutes: 45,
        skill: "moderate",
        dietaryTerms: [],
      }),
    );

    expect(url.searchParams.get("search_query")).toBe(
      "Githeri recipe tutorial English 45 minutes or less moderate cooking",
    );
  });
});
