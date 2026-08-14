import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { signInAction } from "@/features/auth/actions";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign in" };

interface SignInPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const next = (await searchParams).next;
  const nextPath = safeReturnPath(typeof next === "string" ? next : null);

  return (
    <AuthCard
      action={signInAction}
      mode="sign-in"
      nextPath={nextPath}
      title="Good to have you back."
      description="Sign in to pick up your meal plans, pantry, and recommendations."
    />
  );
}
