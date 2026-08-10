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
    <div className="space-y-8 pb-8">
      <section className="overflow-hidden rounded-[2rem] bg-primary px-5 py-7 text-primary-foreground shadow-[0_24px_65px_-36px_rgba(17,55,39,0.9)] sm:px-8 sm:py-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
          Eat Now
        </p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              A confident meal decision, in minutes.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/78 sm:text-base">
              Compare {catalogue.length} locally relevant meals against today&apos;s budget,
              pantry, time, equipment, and dietary needs—then see exactly why each match
              works.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/15">
            <span className="block text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/80">
              Price reference
            </span>
            <span className="mt-1 block font-semibold">
              Nairobi estimates · actual prices vary
            </span>
          </div>
        </div>
      </section>

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
