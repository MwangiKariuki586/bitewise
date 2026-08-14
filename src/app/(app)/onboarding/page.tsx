import type { Metadata } from "next";

import { ProfileFormPage } from "@/features/profile/profile-form-page";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Set up your preferences" };

interface OnboardingPageProps {
  searchParams: Promise<{ returnTo?: string; step?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  return (
    <ProfileFormPage
      mode="onboarding"
      returnTo={safeReturnPath(params.returnTo) ?? "/eat-now"}
      step={params.step}
    />
  );
}
