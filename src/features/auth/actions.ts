"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  formValues,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/features/auth/schemas";

const genericAuthError =
  "We could not complete that request. Check your details and try again.";

async function requestIdentifier(email: string) {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
  return `${ipAddress}:${email}`;
}

async function isAllowed(
  action: string,
  email: string,
  limit: number,
  windowSeconds: number,
) {
  try {
    return await consumeRateLimit({
      action,
      identifier: await requestIdentifier(email),
      limit,
      windowSeconds,
    });
  } catch {
    return false;
  }
}

function validationError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): ActionResult {
  return {
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function signUpAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  if (!(await isAllowed("auth.sign-up", parsed.data.email, 5, 600))) {
    return {
      status: "error",
      message: "Too many attempts. Please wait 10 minutes and try again.",
    };
  }

  const supabase = await createClient();
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/onboarding`,
      data: { display_name: parsed.data.name },
    },
  });

  if (error) return { status: "error", message: genericAuthError };
  if (data.session) redirect("/onboarding");

  return {
    status: "success",
    message: "Check your email to confirm your account, then continue to BiteWise.",
  };
}

export async function signInAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  if (!(await isAllowed("auth.sign-in", parsed.data.email, 5, 600))) {
    return {
      status: "error",
      message: "Too many attempts. Please wait 10 minutes and try again.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { status: "error", message: genericAuthError };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", data.user.id)
    .maybeSingle();

  redirect(profile?.onboarding_completed ? "/eat-now" : "/onboarding");
}

export async function forgotPasswordAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  if (!(await isAllowed("auth.password-reset", parsed.data.email, 3, 3600))) {
    return {
      status: "error",
      message: "Too many reset requests. Please wait before trying again.",
    };
  }

  const supabase = await createClient();
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/auth/update-password`,
  });

  return {
    status: "success",
    message:
      "If an account exists for that email, a secure password reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireUser();
  const parsed = updatePasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { status: "error", message: genericAuthError };
  redirect("/profile");
}

export async function signOutAction() {
  await requireUser();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
