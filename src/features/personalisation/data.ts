import "server-only";

import { getRecipeCatalogue } from "@/features/recipes/data";
import { createClient } from "@/lib/supabase/server";

export interface RecipePersonalisationState {
  feedback: "liked" | "disliked" | null;
  isSaved: boolean;
  lastEatenAt: string | null;
}

export const emptyRecipePersonalisation: RecipePersonalisationState = {
  feedback: null,
  isSaved: false,
  lastEatenAt: null,
};

export async function getRecipePersonalisation(
  userId: string,
  recipeIds: number[],
) {
  const boundedIds = [...new Set(recipeIds)].slice(0, 50);
  if (!boundedIds.length) return new Map<number, RecipePersonalisationState>();
  const supabase = await createClient();
  const [feedbackResult, savedResult, historyResult] = await Promise.all([
    supabase
      .from("recipe_feedback")
      .select("recipe_id,state")
      .eq("user_id", userId)
      .in("recipe_id", boundedIds)
      .limit(50),
    supabase
      .from("saved_recipes")
      .select("recipe_id")
      .eq("user_id", userId)
      .in("recipe_id", boundedIds)
      .limit(50),
    supabase
      .from("meal_history")
      .select("recipe_id,eaten_at")
      .eq("user_id", userId)
      .in("recipe_id", boundedIds)
      .order("eaten_at", { ascending: false })
      .limit(200),
  ]);
  if (feedbackResult.error || savedResult.error || historyResult.error) {
    throw new Error("Recipe preferences could not be loaded.");
  }

  const feedback = new Map(
    feedbackResult.data.map((row) => [
      row.recipe_id,
      row.state as "liked" | "disliked",
    ]),
  );
  const saved = new Set(savedResult.data.map((row) => row.recipe_id));
  const lastEaten = new Map<number, string>();
  historyResult.data.forEach((row) => {
    if (!lastEaten.has(row.recipe_id)) lastEaten.set(row.recipe_id, row.eaten_at);
  });

  return new Map(
    boundedIds.map((recipeId) => [
      recipeId,
      {
        feedback: feedback.get(recipeId) ?? null,
        isSaved: saved.has(recipeId),
        lastEatenAt: lastEaten.get(recipeId) ?? null,
      },
    ]),
  );
}

export async function getSavedRecipePage(userId: string, page = 1) {
  const pageSize = 6;
  const from = (page - 1) * pageSize;
  const [supabase, catalogue] = await Promise.all([
    createClient(),
    getRecipeCatalogue(),
  ]);
  const { data, error, count } = await supabase
    .from("saved_recipes")
    .select("recipe_id,saved_at", { count: "exact" })
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw new Error("Saved meals could not be loaded.");
  const recipes = new Map(catalogue.map((recipe) => [recipe.id, recipe]));
  const personalisation = await getRecipePersonalisation(
    userId,
    data.map((item) => item.recipe_id),
  );
  return {
    items: data.flatMap((savedRecipe) => {
      const recipe = recipes.get(savedRecipe.recipe_id);
      return recipe
        ? [{
            savedAt: savedRecipe.saved_at,
            recipe,
            personalisation:
              personalisation.get(recipe.id) ?? emptyRecipePersonalisation,
          }]
        : [];
    }),
    total: count ?? 0,
    pageSize,
  };
}
