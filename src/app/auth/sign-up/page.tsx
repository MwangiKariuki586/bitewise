import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { signUpAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthCard
      action={signUpAction}
      mode="sign-up"
      title="Make everyday meals easier."
      description="Create your account, then tell us what fits your budget, kitchen, and household."
    />
  );
}
