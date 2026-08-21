import type { RecommendationCandidate } from "@/features/recommendations/ranking";

function preferredDishMatch(name: string, preferredDishes: string[]) {
  const normalizedName = name.toLocaleLowerCase("en-KE");
  return preferredDishes.some((dish) => {
    const normalizedDish = dish.trim().toLocaleLowerCase("en-KE");
    return normalizedDish.length >= 2 &&
      (normalizedName.includes(normalizedDish) || normalizedDish.includes(normalizedName));
  });
}

interface PreferenceInputs {
  preferredCuisines: string[];
  preferredDishes: string[];
  healthGoals: string[];
}

export function recommendationPreferenceMatch(
  candidate: RecommendationCandidate,
  preferences: PreferenceInputs,
) {
  const signals: number[] = [];
  if (preferences.preferredCuisines.length > 0) {
    signals.push(preferences.preferredCuisines.includes(candidate.cuisine) ? 1 : 0);
  }
  if (preferences.healthGoals.length > 0) {
    signals.push(
      candidate.healthTags.filter((tag) => preferences.healthGoals.includes(tag)).length /
        preferences.healthGoals.length,
    );
  }
  if (preferences.preferredDishes.length > 0) {
    signals.push(preferredDishMatch(candidate.name, preferences.preferredDishes) ? 1 : 0);
  }
  return signals.length
    ? signals.reduce((total, value) => total + value, 0) / signals.length
    : 0.5;
}
