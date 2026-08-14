import { MapPin } from "lucide-react";

import { PageIntro } from "@/components/product/page-intro";
import { requireCompletedProfile } from "@/features/profile/data";
import { getRecipeCatalogue } from "@/features/recipes/data";
import { RecommendationForm } from "@/features/recommendations/recommendation-form";
import { defaultMealBudgetMinor } from "@/features/recommendations/schemas";

export default async function EatNowPage() {
  const { profile } = await requireCompletedProfile("/eat-now");
  const catalogue = await getRecipeCatalogue();
  const mealBudgetMinor = defaultMealBudgetMinor(
    profile.budget_minor,
    profile.budget_period,
  );

  return (
    <div className="space-y-4 pb-8 sm:space-y-6">
      <PageIntro
        eyebrow="Eat Now"
        title="A confident meal decision, in minutes."
        description={`Compare ${catalogue.length} locally relevant meals against today's budget, pantry, time, equipment, and dietary needs.`}
        variant="standard"
      />

      <p
        id="pricing-context"
        className="flex min-h-8 w-fit items-center gap-1.5 rounded-full bg-card px-3 text-[0.68rem] font-medium text-muted-foreground ring-1 ring-border/65"
      >
        <MapPin className="size-3.5 text-primary" aria-hidden="true" />
        Nairobi estimates · actual prices vary
      </p>

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
