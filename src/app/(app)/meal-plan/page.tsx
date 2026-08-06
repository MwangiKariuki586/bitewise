import { FeaturePlaceholder } from "@/components/product/feature-placeholder";
import { requireCompletedProfile } from "@/features/profile/data";

export default async function MealPlanPage() {
  await requireCompletedProfile();
  return <FeaturePlaceholder eyebrow="Meal Plan" title="Plan the week without overthinking it." description="Build a practical week of meals, swap what does not fit, and turn the result into one clear shopping list." accent="A calmer week starts here." />;
}
