import { FeaturePlaceholder } from "@/components/product/feature-placeholder";
import { requireCompletedProfile } from "@/features/profile/data";

export default async function EatNowPage() {
  await requireCompletedProfile();
  return <FeaturePlaceholder eyebrow="Eat Now" title="A confident meal decision, in minutes." description="Tell BiteWise what today looks like. Your budget, pantry, time, and preferences will shape a practical shortlist." accent="Less guessing. More meals that fit." />;
}
