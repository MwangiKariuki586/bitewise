import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { signInAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthCard
      action={signInAction}
      mode="sign-in"
      title="Good to have you back."
      description="Sign in to pick up your meal plans, pantry, and recommendations."
    />
  );
}
