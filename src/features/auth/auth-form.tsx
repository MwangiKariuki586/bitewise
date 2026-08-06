"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

import type { ActionResult } from "@/lib/action-result";
import { initialActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "resend-confirmation"
  | "update-password";

interface AuthFormProps {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  mode: AuthMode;
}

const submitLabels: Record<AuthMode, string> = {
  "sign-in": "Sign in",
  "sign-up": "Create my account",
  "forgot-password": "Send reset link",
  "resend-confirmation": "Resend confirmation",
  "update-password": "Update password",
};

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="text-sm font-medium text-destructive">
      {errors[0]}
    </p>
  );
}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionResult);
  const showEmail = mode !== "update-password";
  const showPassword = mode !== "forgot-password" && mode !== "resend-confirmation";
  const showName = mode === "sign-up";
  const showConfirmPassword = mode === "update-password";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {showName ? (
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            autoFocus
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          />
          <FieldError id="name-error" errors={state.fieldErrors?.name} />
        </div>
      ) : null}

      {showEmail ? (
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus={!showName}
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          />
          <FieldError id="email-error" errors={state.fieldErrors?.email} />
        </div>
      ) : null}

      {showPassword ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password">
              {mode === "update-password" ? "New password" : "Password"}
            </Label>
            {mode === "sign-in" ? (
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            autoFocus={mode === "update-password"}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          />
          <FieldError id="password-error" errors={state.fieldErrors?.password} />
          {mode !== "sign-in" ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Use 8 or more characters with a letter, number, and symbol.
            </p>
          ) : null}
        </div>
      ) : null}

      {showConfirmPassword ? (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            aria-describedby={
              state.fieldErrors?.confirmPassword ? "confirm-password-error" : undefined
            }
          />
          <FieldError
            id="confirm-password-error"
            errors={state.fieldErrors?.confirmPassword}
          />
        </div>
      ) : null}

      {state.message ? (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "rounded-xl bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive"
              : "rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"
          }
        >
          {state.message}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="size-4" aria-hidden="true" />
        )}
        {pending ? "Please wait…" : submitLabels[mode]}
      </Button>
    </form>
  );
}
