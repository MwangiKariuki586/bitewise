import { redirect } from "next/navigation";

import {
  OnboardingForm,
  type OnboardingStep,
  type ProfileDefaults,
} from "@/features/profile/onboarding-form";
import { getCurrentProfile } from "@/features/profile/data";

const validSteps = new Set<OnboardingStep>(["basics", "kitchen", "preferences"]);

interface ProfileFormPageProps {
  mode: "edit" | "onboarding";
  returnTo: string;
  step?: string;
}

export async function ProfileFormPage({ mode, returnTo, step }: ProfileFormPageProps) {
  const formPath = mode === "edit" ? "/profile/edit" : "/onboarding";
  const authParams = new URLSearchParams();
  if (returnTo !== "/eat-now") authParams.set("returnTo", returnTo);
  if (step) authParams.set("step", step);
  const authReturnTo = `${formPath}${authParams.size ? `?${authParams}` : ""}`;
  const { profile } = await getCurrentProfile(authReturnTo);

  if (mode === "onboarding" && profile?.onboarding_completed) redirect("/eat-now");
  if (mode === "edit" && !profile?.onboarding_completed) {
    redirect(`/onboarding?${new URLSearchParams({ returnTo })}`);
  }

  const requestedStep = step as OnboardingStep | undefined;
  const currentStep = requestedStep && validSteps.has(requestedStep)
    ? requestedStep
    : "basics";
  const defaults: ProfileDefaults = {
    availableMinutes: profile?.eat_now_minutes ?? profile?.available_minutes ?? 45,
    breakfastMinutes: profile?.breakfast_minutes ?? profile?.available_minutes ?? 45,
    lunchMinutes: profile?.lunch_minutes ?? profile?.available_minutes ?? 45,
    dinnerMinutes: profile?.dinner_minutes ?? profile?.available_minutes ?? 45,
    budgetKes: profile?.budget_minor ? profile.budget_minor / 100 : null,
    budgetPeriod: profile?.budget_period ?? "weekly",
    dietaryPreferences: profile?.dietary_preferences ?? [],
    displayName: profile?.display_name ?? "",
    equipment: profile?.equipment ?? [],
    healthGoals: profile?.health_goals ?? [],
    householdSize: profile?.household_size ?? 1,
    preferredCuisines: profile?.preferred_cuisines ?? [],
    preferredDishes: profile?.preferred_dishes ?? [],
  };

  return (
    <OnboardingForm
      defaults={defaults}
      formPath={formPath}
      returnTo={returnTo}
      step={currentStep}
    />
  );
}
