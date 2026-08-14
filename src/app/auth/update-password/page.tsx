import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { updatePasswordAction } from "@/features/auth/actions";
import { safeReturnPath } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

interface UpdatePasswordPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  await requireUser();
  const next = (await searchParams).next;
  const nextPath = safeReturnPath(typeof next === "string" ? next : null);

  return (
    <AuthCard
      action={updatePasswordAction}
      mode="update-password"
      nextPath={nextPath}
      title="Choose a new password."
      description="Use a strong password you haven’t used for this account before."
    />
  );
}
