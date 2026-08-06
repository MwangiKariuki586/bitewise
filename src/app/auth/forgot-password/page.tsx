import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { forgotPasswordAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      action={forgotPasswordAction}
      mode="forgot-password"
      title="Reset your password."
      description="Enter your email and we’ll send a secure reset link if it matches an account."
    />
  );
}
