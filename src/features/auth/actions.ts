"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-result";
import {
  postAuthenticationPath,
  safeReturnPath,
} from "@/lib/auth/redirect";
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
import {
  authErrorMessage,
  emailSendRateLimitMessage,
  isEmailSendRateLimit,
} from "@/features/auth/errors";

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

function requestedPath(formData: FormData) {
  const value = formData.get("next");
  return safeReturnPath(typeof value === "string" ? value : null);
}

function confirmationRedirect(siteUrl: string, nextPath: string) {
  const url = new URL("/auth/confirm", siteUrl);
  url.searchParams.set("next", nextPath);
  return url.toString();
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
  const destination = postAuthenticationPath(requestedPath(formData), false);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: confirmationRedirect(NEXT_PUBLIC_SITE_URL, destination),
      data: { display_name: parsed.data.name },
    },
  });

  if (error) {
    return {
      status: "error",
      message: authErrorMessage(error, "sign-up"),
    };
  }
  if (data.session) redirect(destination);

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
    return {
      status: "error",
      message: error
        ? authErrorMessage(error, "sign-in")
        : "Sign-in could not be completed. Please try again.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("user_id", data.user.id)
    .maybeSingle();

  redirect(
    postAuthenticationPath(
      requestedPath(formData),
      Boolean(profile?.onboarding_completed),
    ),
  );
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
  const nextPath = requestedPath(formData);
  const updatePasswordPath = nextPath
    ? `/auth/update-password?${new URLSearchParams({ next: nextPath })}`
    : "/auth/update-password";
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmationRedirect(NEXT_PUBLIC_SITE_URL, updatePasswordPath),
  });

  return {
    status: "success",
    message:
      "If an account exists for that email, a secure password reset link is on its way.",
  };
}

export async function resendConfirmationAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(formValues(formData));
  if (!parsed.success) return validationError(parsed.error);

  if (!(await isAllowed("auth.resend-confirmation", parsed.data.email, 3, 3600))) {
    return {
      status: "error",
      message: "Too many confirmation requests. Please wait before trying again.",
    };
  }

  const supabase = await createClient();
  const { NEXT_PUBLIC_SITE_URL } = getPublicEnv();
  const destination = postAuthenticationPath(requestedPath(formData), false);
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: confirmationRedirect(NEXT_PUBLIC_SITE_URL, destination),
    },
  });

  if (error && isEmailSendRateLimit(error)) {
    return { status: "error", message: emailSendRateLimitMessage };
  }

  return {
    status: "success",
    message:
      "If an unconfirmed account exists for that email, a new confirmation link is on its way.",
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

  if (error) {
    return { status: "error", message: authErrorMessage(error, "update-password") };
  }
  redirect(requestedPath(formData) ?? "/profile");
}

export async function signOutAction() {
  await requireUser();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
