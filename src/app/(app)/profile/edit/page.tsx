import type { Metadata } from "next";

import { ProfileFormPage } from "@/features/profile/profile-form-page";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Edit preferences" };

interface EditProfilePageProps {
  searchParams: Promise<{ returnTo?: string; step?: string }>;
}

export default async function EditProfilePage({ searchParams }: EditProfilePageProps) {
  const params = await searchParams;
  return (
    <ProfileFormPage
      mode="edit"
      returnTo={safeReturnPath(params.returnTo) ?? "/profile"}
      step={params.step}
    />
  );
}
