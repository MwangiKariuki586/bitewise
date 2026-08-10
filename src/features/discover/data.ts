import "server-only";

import { unstable_cache } from "next/cache";

import type { DiscoverSearchInput } from "@/features/discover/schemas";
import { createPublicClient } from "@/lib/supabase/public";

export const discoverPageSize = 12;

async function loadPublicRecipeSearch(input: DiscoverSearchInput) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("search_public_recipes", {
    p_query: input.q,
    p_max_minutes: input.maxMinutes,
    p_equipment: input.equipment,
    p_dietary_tags: input.diet,
    p_max_cost_minor: input.maxCostKes ? input.maxCostKes * 100 : undefined,
    p_ingredient_query: input.ingredient,
    p_cuisine: input.cuisine,
    p_difficulty: input.skill,
    p_limit: discoverPageSize,
    p_offset: (input.page - 1) * discoverPageSize,
  });

  if (error) {
    throw new Error("The public recipe search could not be loaded.");
  }

  return {
    recipes: data.map((recipe) => ({
      id: recipe.recipe_id,
      slug: recipe.slug,
      name: recipe.name,
      summary: recipe.summary,
      cuisine: recipe.cuisine,
      mealTypes: recipe.meal_types,
      baseServings: recipe.base_servings,
      totalMinutes: recipe.total_minutes,
      difficulty: recipe.difficulty,
      requiredEquipment: recipe.required_equipment,
      dietaryTags: recipe.dietary_tags,
      estimatedCostMinor: recipe.estimated_cost_minor,
      estimatedCostPerServingMinor: recipe.estimated_cost_per_serving_minor,
      costCapturedOn: recipe.cost_captured_on,
      image: recipe.image_path
        ? {
            path: recipe.image_path,
            alt: recipe.image_alt,
            width: recipe.image_width,
            height: recipe.image_height,
          }
        : null,
    })),
    total: data[0]?.total_count ?? 0,
  };
}

export const searchPublicRecipes = unstable_cache(
  loadPublicRecipeSearch,
  ["discover-public-search-v1"],
  { revalidate: 3_600, tags: ["recipe-catalogue"] },
);

export type DiscoverRecipe = Awaited<
  ReturnType<typeof searchPublicRecipes>
>["recipes"][number];
