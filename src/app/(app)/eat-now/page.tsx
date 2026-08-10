import { PageIntro } from "@/components/product/page-intro";
import { requireCompletedProfile } from "@/features/profile/data";
import { getRecipeCatalogue } from "@/features/recipes/data";
import { RecommendationForm } from "@/features/recommendations/recommendation-form";
import { defaultMealBudgetMinor } from "@/features/recommendations/schemas";

export default async function EatNowPage() {
  const { profile } = await requireCompletedProfile();
  const catalogue = await getRecipeCatalogue();
  const mealBudgetMinor = defaultMealBudgetMinor(
    profile.budget_minor,
    profile.budget_period,
  );

  return (
    <div className="space-y-5 pb-8 sm:space-y-7">
      <PageIntro
        eyebrow="Eat Now"
        title="A confident meal decision, in minutes."
        description={`Compare ${catalogue.length} locally relevant meals against today's budget, pantry, time, equipment, and dietary needs.`}
      />

      <RecommendationForm
        defaults={{
          budgetKes: Math.floor(mealBudgetMinor / 100),
          servings: profile.household_size,
          maxMinutes: profile.available_minutes,
          equipment: profile.equipment,
          dietaryPreferences: profile.dietary_preferences,
        }}
      />
    </div>
  );
}
