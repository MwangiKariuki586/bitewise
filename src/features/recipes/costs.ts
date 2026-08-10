export interface CostedIngredient {
  ingredientId: number;
  isOptional: boolean;
  quantity: number;
}

export interface IngredientCostReference {
  ingredientId: number;
  priceMinor: number;
  quantity: number;
}

export function estimateRecipeCostMinor(
  ingredients: CostedIngredient[],
  costs: IngredientCostReference[],
  includeOptional = false,
) {
  const costsByIngredient = new Map(
    costs.map((cost) => [cost.ingredientId, cost]),
  );
  let estimatedCost = 0;

  for (const ingredient of ingredients) {
    if (ingredient.isOptional && !includeOptional) continue;

    const cost = costsByIngredient.get(ingredient.ingredientId);
    if (!cost || cost.quantity <= 0) return null;

    estimatedCost += (ingredient.quantity / cost.quantity) * cost.priceMinor;
  }

  return Math.ceil(estimatedCost);
}

export function estimateCostPerServingMinor(
  estimatedCostMinor: number | null,
  servings: number,
) {
  if (estimatedCostMinor === null || servings <= 0) return null;
  return Math.ceil(estimatedCostMinor / servings);
}
