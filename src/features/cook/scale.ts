export function scaleIngredientQuantity(
  quantity: number,
  baseServings: number,
  selectedServings: number,
) {
  if (baseServings <= 0 || selectedServings <= 0) return 0;
  return (quantity * selectedServings) / baseServings;
}

export function formatScaledQuantity(quantity: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(quantity);
}
