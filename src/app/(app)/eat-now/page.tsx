import Image from "next/image";
import { Info } from "lucide-react";

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
      <div className="relative min-h-[16rem] overflow-hidden rounded-[1.75rem] bg-card sm:min-h-[19rem]">
        <div className="relative z-10 max-w-xl p-5 sm:p-8 lg:p-10">
          <PageIntro
            eyebrow="Eat Now"
            title="A confident meal decision, in minutes."
            description={`Compare ${catalogue.length} locally relevant meals against today's budget, pantry, time, equipment, and dietary needs.`}
            variant="standard"
          />
        </div>
        <div className="absolute inset-y-0 right-0 w-[62%] opacity-35 sm:opacity-70 lg:opacity-100">
          <Image src="/images/recipes/githeri.webp" alt="Githeri with avocado, a locally relevant Kenyan meal" fill priority sizes="(max-width: 1023px) 62vw, 720px" className="object-cover [mask-image:linear-gradient(to_right,transparent,black_28%)]" />
        </div>
      </div>

      <p
        id="pricing-context"
        className="flex min-h-8 w-fit items-center gap-1.5 rounded-full bg-card px-3 text-[0.68rem] font-medium text-muted-foreground ring-1 ring-border/65"
      >
        <Info className="size-3.5 text-primary" aria-hidden="true" />
        Prices estimated from local stores today
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
