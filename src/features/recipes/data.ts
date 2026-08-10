import "server-only";

import { unstable_cache } from "next/cache";

import {
  estimateCostPerServingMinor,
  estimateRecipeCostMinor,
} from "@/features/recipes/costs";
import { createPublicClient } from "@/lib/supabase/public";

const catalogueRevalidationSeconds = 86_400;
const recipeColumns = `
  id,
  slug,
  name,
  summary,
  cuisine,
  meal_types,
  base_servings,
  prep_minutes,
  cook_minutes,
  difficulty,
  accepted_heat_sources,
  required_equipment,
  dietary_tags,
  health_tags,
  recipe_steps(
    step_number,
    instruction
  ),
  recipe_images(
    local_path,
    alt_text,
    width,
    height,
    attribution_name,
    attribution_url,
    license_name,
    license_url,
    is_primary
  ),
  recipe_ingredients(
    ingredient_id,
    quantity,
    unit,
    is_optional,
    preparation,
    sort_order,
    ingredient:ingredients!recipe_ingredients_ingredient_fkey(
      id,
      slug,
      name,
      default_unit
    )
  )
`;

async function loadRecipeCatalogue() {
  const supabase = createPublicClient();
  const [recipeResult, costResult, substitutionResult] = await Promise.all([
    supabase
      .from("recipes")
      .select(recipeColumns)
      .eq("is_active", true)
      .order("name")
      .limit(100),
    supabase
      .from("ingredient_costs")
      .select(
        "ingredient_id,quantity,unit,price_minor,location,source_label,source_url,captured_on",
      )
      .eq("is_active", true)
      .eq("location", "Nairobi")
      .order("ingredient_id")
      .limit(200),
    supabase
      .from("ingredient_substitutions")
      .select(`
        source_ingredient_id,
        source_quantity,
        source_unit,
        alternative_quantity,
        alternative_unit,
        note,
        alternative:ingredients!ingredient_substitutions_alternative_fkey(
          id,
          slug,
          name,
          default_unit
        )
      `)
      .eq("is_active", true)
      .order("source_ingredient_id")
      .limit(100),
  ]);

  if (recipeResult.error || costResult.error || substitutionResult.error) {
    throw new Error("The recipe catalogue could not be loaded.");
  }

  const costs = costResult.data.map((cost) => ({
    ingredientId: cost.ingredient_id,
    priceMinor: cost.price_minor,
    quantity: cost.quantity,
  }));

  return recipeResult.data.map((recipe) => {
    const primaryImage = recipe.recipe_images.find((image) => image.is_primary);
    const ingredients = [...recipe.recipe_ingredients]
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((recipeIngredient) => ({
        id: recipeIngredient.ingredient.id,
        slug: recipeIngredient.ingredient.slug,
        name: recipeIngredient.ingredient.name,
        quantity: recipeIngredient.quantity,
        unit: recipeIngredient.unit,
        isOptional: recipeIngredient.is_optional,
        preparation: recipeIngredient.preparation,
        estimatedCostMinor: estimateRecipeCostMinor(
          [
            {
              ingredientId: recipeIngredient.ingredient_id,
              isOptional: false,
              quantity: recipeIngredient.quantity,
            },
          ],
          costs,
        ),
        alternatives: substitutionResult.data
          .filter(
            (substitution) =>
              substitution.source_ingredient_id === recipeIngredient.ingredient_id,
          )
          .map((substitution) => {
            const scaledQuantity =
              (recipeIngredient.quantity / substitution.source_quantity) *
              substitution.alternative_quantity;
            return {
              ingredient: substitution.alternative,
              sourceQuantity: substitution.source_quantity,
              sourceUnit: substitution.source_unit,
              alternativeQuantity: substitution.alternative_quantity,
              alternativeUnit: substitution.alternative_unit,
              scaledQuantity,
              estimatedCostMinor: estimateRecipeCostMinor(
                [
                  {
                    ingredientId: substitution.alternative.id,
                    isOptional: false,
                    quantity: scaledQuantity,
                  },
                ],
                costs,
              ),
              note: substitution.note,
            };
          }),
      }));
    const estimatedCostMinor = estimateRecipeCostMinor(
      recipe.recipe_ingredients.map((ingredient) => ({
        ingredientId: ingredient.ingredient_id,
        isOptional: ingredient.is_optional,
        quantity: ingredient.quantity,
      })),
      costs,
    );

    return {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      summary: recipe.summary,
      cuisine: recipe.cuisine,
      mealTypes: recipe.meal_types,
      baseServings: recipe.base_servings,
      prepMinutes: recipe.prep_minutes,
      cookMinutes: recipe.cook_minutes,
      totalMinutes: recipe.prep_minutes + recipe.cook_minutes,
      difficulty: recipe.difficulty,
      acceptedHeatSources: recipe.accepted_heat_sources,
      requiredEquipment: recipe.required_equipment,
      dietaryTags: recipe.dietary_tags,
      healthTags: recipe.health_tags,
      instructions: [...recipe.recipe_steps]
        .sort((left, right) => left.step_number - right.step_number)
        .map((step) => step.instruction),
      image: primaryImage
        ? {
            path: primaryImage.local_path,
            alt: primaryImage.alt_text,
            width: primaryImage.width,
            height: primaryImage.height,
            attributionName: primaryImage.attribution_name,
            attributionUrl: primaryImage.attribution_url,
            licenseName: primaryImage.license_name,
            licenseUrl: primaryImage.license_url,
          }
        : null,
      ingredients,
      estimatedCostMinor,
      estimatedCostPerServingMinor: estimateCostPerServingMinor(
        estimatedCostMinor,
        recipe.base_servings,
      ),
      costLocation: costResult.data[0]?.location ?? null,
      costCapturedOn: costResult.data[0]?.captured_on ?? null,
      costSourceLabel: costResult.data[0]?.source_label ?? null,
      costSourceUrl: costResult.data[0]?.source_url ?? null,
    };
  });
}

export const getRecipeCatalogue = unstable_cache(
  loadRecipeCatalogue,
  ["recipe-catalogue-v1"],
  {
    revalidate: catalogueRevalidationSeconds,
    tags: ["recipe-catalogue"],
  },
);

export type RecipeCatalogue = Awaited<ReturnType<typeof getRecipeCatalogue>>;
export type RecipeCatalogueItem = RecipeCatalogue[number];

export async function getPublicRecipeBySlug(slug: string) {
  const catalogue = await getRecipeCatalogue();
  return catalogue.find((recipe) => recipe.slug === slug) ?? null;
}
