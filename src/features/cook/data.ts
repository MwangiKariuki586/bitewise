import "server-only";

import { getRecipeCatalogue } from "@/features/recipes/data";
import { createClient } from "@/lib/supabase/server";

const sessionColumns = "id,recipe_id,servings,current_step,status,started_at,updated_at";

export async function getActiveCookSessions(userId: string) {
  const [supabase, catalogue] = await Promise.all([
    createClient(),
    getRecipeCatalogue(),
  ]);
  const { data, error } = await supabase
    .from("cook_sessions")
    .select(sessionColumns)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(10);
  if (error) throw new Error("Cooking sessions could not be loaded.");

  const recipes = new Map(catalogue.map((recipe) => [recipe.id, recipe]));
  return data.flatMap((session) => {
    const recipe = recipes.get(session.recipe_id);
    return recipe ? [{ ...session, recipe }] : [];
  });
}

export async function getCookSession(userId: string, recipeId: number) {
  const [supabase, catalogue] = await Promise.all([
    createClient(),
    getRecipeCatalogue(),
  ]);
  const recipe = catalogue.find((item) => item.id === recipeId) ?? null;
  if (!recipe) return { recipe: null, session: null, completedSteps: [] as number[] };

  const { data: session, error } = await supabase
    .from("cook_sessions")
    .select(sessionColumns)
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error("The cooking session could not be loaded.");
  if (!session) return { recipe, session: null, completedSteps: [] as number[] };

  const { data: steps, error: stepsError } = await supabase
    .from("cook_session_steps")
    .select("step_number")
    .eq("user_id", userId)
    .eq("session_id", session.id)
    .order("step_number")
    .limit(30);
  if (stepsError) throw new Error("Cooking progress could not be loaded.");

  return {
    recipe,
    session,
    completedSteps: steps.map((step) => step.step_number),
  };
}
