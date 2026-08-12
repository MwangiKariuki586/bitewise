"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

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

interface PasswordInputProps {
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  describedBy?: string;
  id: "password" | "confirmPassword";
  invalid: boolean;
  name: "password" | "confirmPassword";
  onChange: (value: string) => void;
  toggleLabel: string;
  value: string;
}

function PasswordInput({
  autoComplete,
  autoFocus,
  describedBy,
  id,
  invalid,
  name,
  onChange,
  toggleLabel,
  value,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="pr-12"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 grid min-h-11 w-12 place-items-center rounded-r-xl text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={`${visible ? "Hide" : "Show"} ${toggleLabel}`}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [state, formAction, pending] = useActionState(
    async (previousState: ActionResult, formData: FormData) => {
      const result = await action(previousState, formData);
      if (result.status === "success") {
        setValues({ name: "", email: "", password: "", confirmPassword: "" });
      }
      return result;
    },
    initialActionResult,
  );
  const showEmail = mode !== "update-password";
  const showPassword = mode !== "forgot-password" && mode !== "resend-confirmation";
  const showName = mode === "sign-up";
  const showConfirmPassword = mode === "sign-up" || mode === "update-password";

  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

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
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
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
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
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
          <PasswordInput
            id="password"
            name="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            autoFocus={mode === "update-password"}
            invalid={Boolean(state.fieldErrors?.password)}
            describedBy={state.fieldErrors?.password ? "password-error" : undefined}
            value={values.password}
            onChange={(value) => updateValue("password", value)}
            toggleLabel={mode === "update-password" ? "new password" : "password"}
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
          <Label htmlFor="confirmPassword">
            {mode === "update-password" ? "Confirm new password" : "Confirm password"}
          </Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            invalid={Boolean(state.fieldErrors?.confirmPassword)}
            describedBy={
              state.fieldErrors?.confirmPassword ? "confirm-password-error" : undefined
            }
            value={values.confirmPassword}
            onChange={(value) => updateValue("confirmPassword", value)}
            toggleLabel={
              mode === "update-password" ? "new password confirmation" : "password confirmation"
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
