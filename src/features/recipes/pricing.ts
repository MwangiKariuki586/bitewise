import type { RecipeCatalogueItem } from "@/features/recipes/data";
import {
  rankRecommendations,
  type RecommendationPantryItem,
} from "@/features/recommendations/ranking";

export function ingredientValueMinor(recipe: RecipeCatalogueItem, servings: number) {
  if (recipe.estimatedCostMinor === null) return null;
  return Math.ceil(recipe.estimatedCostMinor * servings / recipe.baseServings);
}

export function cashNeededMinor(
  recipe: RecipeCatalogueItem,
  pantryItems: RecommendationPantryItem[],
  servings: number,
  today: string,
) {
  const ingredientValue = ingredientValueMinor(recipe, servings) ?? 0;
  const [priced] = rankRecommendations([
    {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      summary: recipe.summary,
      cuisine: recipe.cuisine,
      mealTypes: recipe.mealTypes,
      baseServings: recipe.baseServings,
      totalMinutes: recipe.totalMinutes,
      difficulty: recipe.difficulty,
      healthTags: recipe.healthTags,
      ingredients: recipe.ingredients,
      image: recipe.image,
      estimatedCostMinor: ingredientValue,
      affordableCostMinor: ingredientValue,
      usesSubstitution: false,
    },
  ], pantryItems, {
    budgetMinor: 100_000_000,
    servings,
    maxMinutes: 480,
    preferredCuisines: [],
    preferredDishes: [],
    healthGoals: [],
    today,
    affordabilityMode: "purchase-cost",
  });
  return priced?.cashNeededMinor ?? ingredientValue;
}
