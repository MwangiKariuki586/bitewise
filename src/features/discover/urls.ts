import type { DiscoverSearchInput } from "@/features/discover/schemas";

export function discoverHref(input: DiscoverSearchInput, page: number) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.ingredient) params.set("ingredient", input.ingredient);
  if (input.maxMinutes) params.set("maxMinutes", String(input.maxMinutes));
  if (input.maxCostKes) params.set("maxCostKes", String(input.maxCostKes));
  if (input.cuisine) params.set("cuisine", input.cuisine);
  if (input.skill) params.set("skill", input.skill);
  input.equipment.forEach((value) => params.append("equipment", value));
  input.diet.forEach((value) => params.append("diet", value));
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}
