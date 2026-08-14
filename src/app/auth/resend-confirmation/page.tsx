import type { Metadata } from "next";

import { resendConfirmationAction } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/auth-card";
import { safeReturnPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Resend confirmation" };

interface ResendConfirmationPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function ResendConfirmationPage({ searchParams }: ResendConfirmationPageProps) {
  const next = (await searchParams).next;
  const nextPath = safeReturnPath(typeof next === "string" ? next : null);

  return (
    <AuthCard
      action={resendConfirmationAction}
      mode="resend-confirmation"
      nextPath={nextPath}
      title="Send a fresh confirmation link."
      description="Enter the email you registered with. For privacy, the response is the same whether or not an unconfirmed account exists."
    />
  );
}
