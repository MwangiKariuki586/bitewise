import Link from "next/link";

import type { ActionResult } from "@/lib/action-result";
import { AuthForm } from "@/features/auth/auth-form";
import { authPath } from "@/lib/auth/redirect";

type AuthMode =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "resend-confirmation"
  | "update-password";

interface AuthCardProps {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  description: string;
  mode: AuthMode;
  nextPath?: string | null;
  title: string;
}

export function AuthCard({ action, description, mode, nextPath = null, title }: AuthCardProps) {
  return (
    <section className="w-full max-w-md rounded-[1.75rem] bg-card p-6 shadow-[0_24px_70px_-38px_rgba(45,39,27,0.6)] sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Welcome to BiteWise
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-7">
        <AuthForm action={action} mode={mode} nextPath={nextPath} />
      </div>

      {mode === "sign-in" ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to BiteWise?{" "}
          <Link href={authPath("/auth/sign-up", nextPath)} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      ) : null}
      {mode === "sign-up" ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={authPath("/auth/sign-in", nextPath)} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      ) : null}
      {mode === "forgot-password" ? (
        <p className="mt-6 text-center text-sm">
          <Link href={authPath("/auth/sign-in", nextPath)} className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      ) : null}
      {mode === "resend-confirmation" ? (
        <p className="mt-6 text-center text-sm">
          <Link href={authPath("/auth/sign-in", nextPath)} className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      ) : null}
      {mode === "sign-up" ? (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Waiting for confirmation?{" "}
          <Link
            href={authPath("/auth/resend-confirmation", nextPath)}
            className="font-semibold text-primary hover:underline"
          >
            Resend the email
          </Link>
        </p>
      ) : null}
    </section>
  );
}
