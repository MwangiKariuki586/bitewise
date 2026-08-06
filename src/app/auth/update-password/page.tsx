import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { updatePasswordAction } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function UpdatePasswordPage() {
  await requireUser();

  return (
    <AuthCard
      action={updatePasswordAction}
      mode="update-password"
      title="Choose a new password."
      description="Use a strong password you haven’t used for this account before."
    />
  );
}
