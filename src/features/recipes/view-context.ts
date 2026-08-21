import { z } from "zod";

export const recipeViewSourceSchema = z.enum([
  "discover",
  "eat-now",
  "meal-plan",
  "saved",
]);

export type RecipeViewSource = z.infer<typeof recipeViewSourceSchema>;

export interface RecipeViewContext {
  source: RecipeViewSource | "direct";
  servings: number;
  recommendationRunId: string | null;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseRecipeViewContext(
  searchParams: Record<string, string | string[] | undefined>,
): RecipeViewContext {
  const source = recipeViewSourceSchema.safeParse(firstValue(searchParams.source));
  const servings = z.coerce.number().int().min(1).max(30).safeParse(
    firstValue(searchParams.servings),
  );
  const recommendationRunId = z.uuid().safeParse(
    firstValue(searchParams.recommendationRun),
  );
  return {
    source: source.success ? source.data : "direct",
    servings: servings.success ? servings.data : 1,
    recommendationRunId: recommendationRunId.success ? recommendationRunId.data : null,
  };
}

export function recipeViewHref(
  slug: string,
  source: RecipeViewSource,
  servings: number,
  recommendationRunId: string | null = null,
) {
  const params = new URLSearchParams({
    source,
    servings: String(Math.min(30, Math.max(1, Math.trunc(servings)))),
  });
  if (source === "eat-now" && recommendationRunId) {
    params.set("recommendationRun", recommendationRunId);
  }
  return `/recipes/${slug}?${params}`;
}
