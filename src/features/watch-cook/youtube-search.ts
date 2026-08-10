export const tutorialLanguages = [
  { value: "english", label: "English", searchTerm: "English" },
  { value: "swahili", label: "Swahili", searchTerm: "Kiswahili" },
] as const;

export type TutorialLanguage = (typeof tutorialLanguages)[number]["value"];

export interface YouTubeTutorialSearchInput {
  recipeName: string;
  language: TutorialLanguage;
  maxMinutes: number;
  skill: "easy" | "moderate";
  equipment?: string;
  dietaryTerms: string[];
}

function readableTerm(value: string) {
  return value.replaceAll("_", " ");
}

export function buildYouTubeTutorialSearchUrl(input: YouTubeTutorialSearchInput) {
  const language = tutorialLanguages.find((option) => option.value === input.language);
  const terms = [
    input.recipeName.trim(),
    "recipe tutorial",
    language?.searchTerm ?? "English",
    `${input.maxMinutes} minutes or less`,
    `${readableTerm(input.skill)} cooking`,
    input.equipment ? `using ${readableTerm(input.equipment)}` : "",
    ...input.dietaryTerms.map(readableTerm),
  ].filter(Boolean);
  const params = new URLSearchParams({ search_query: terms.join(" ") });
  return `https://www.youtube.com/results?${params.toString()}`;
}
