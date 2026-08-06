import type { Metadata } from "next";

import { resendConfirmationAction } from "@/features/auth/actions";
import { AuthCard } from "@/features/auth/auth-card";

export const metadata: Metadata = { title: "Resend confirmation" };

export default function ResendConfirmationPage() {
  return (
    <AuthCard
      action={resendConfirmationAction}
      mode="resend-confirmation"
      title="Send a fresh confirmation link."
      description="Enter the email you registered with. For privacy, the response is the same whether or not an unconfirmed account exists."
    />
  );
}
