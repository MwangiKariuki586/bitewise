import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { signUpAction } from "@/features/auth/actions";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Create account" };

interface SignUpPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const next = (await searchParams).next;
  const nextPath = safeReturnPath(typeof next === "string" ? next : null);

  return (
    <AuthCard
      action={signUpAction}
      mode="sign-up"
      nextPath={nextPath}
      title="Make everyday meals easier."
      description="Create your account, then tell us what fits your budget, kitchen, and household."
    />
  );
}
