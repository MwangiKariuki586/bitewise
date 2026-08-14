import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { forgotPasswordAction } from "@/features/auth/actions";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Reset password" };

interface ForgotPasswordPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const next = (await searchParams).next;
  const nextPath = safeReturnPath(typeof next === "string" ? next : null);

  return (
    <AuthCard
      action={forgotPasswordAction}
      mode="forgot-password"
      nextPath={nextPath}
      title="Reset your password."
      description="Enter your email and we’ll send a secure reset link if it matches an account."
    />
  );
}
