import type { RecommendationPurchasePack } from "@/features/recommendations/ranking";

export function purchaseCostForQuantity(
  quantity: number,
  unit: string,
  pack: RecommendationPurchasePack | null,
) {
  if (!pack || pack.unit !== unit || quantity <= 0 || pack.quantity <= 0) {
    return null;
  }
  const practicalIncrement =
    unit === "g" ? 100 :
    unit === "kg" ? 0.1 :
    unit === "ml" ? 100 :
    unit === "l" ? 0.1 :
    unit === "cup" ? 0.25 :
    1;
  const purchaseQuantity =
    Math.ceil(quantity / practicalIncrement) * practicalIncrement;
  return {
    quantity: purchaseQuantity,
    unit: pack.unit,
    costMinor: Math.ceil((purchaseQuantity / pack.quantity) * pack.priceMinor),
  };
}
