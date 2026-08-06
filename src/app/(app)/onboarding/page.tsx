import type { Metadata } from "next";

import {
  OnboardingForm,
  type OnboardingStep,
  type ProfileDefaults,
} from "@/features/profile/onboarding-form";
import { getCurrentProfile } from "@/features/profile/data";

export const metadata: Metadata = { title: "Set up your preferences" };

const validSteps = new Set<OnboardingStep>(["basics", "kitchen", "preferences"]);

function safePath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/eat-now";
}

interface OnboardingPageProps {
  searchParams: Promise<{ returnTo?: string; step?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const [{ profile }, params] = await Promise.all([getCurrentProfile(), searchParams]);
  const requestedStep = params.step as OnboardingStep | undefined;
  const step = requestedStep && validSteps.has(requestedStep) ? requestedStep : "basics";
  const defaults: ProfileDefaults = {
    availableMinutes: profile?.available_minutes ?? 45,
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

  return <OnboardingForm defaults={defaults} returnTo={safePath(params.returnTo)} step={step} />;
}
