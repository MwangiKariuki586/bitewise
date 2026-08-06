import Link from "next/link";
import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <section className="w-full max-w-md rounded-[1.75rem] bg-card p-7 text-center shadow-[0_24px_70px_-38px_rgba(45,39,27,0.6)] sm:p-9">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-4xl font-semibold">That link didn’t work.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        It may have expired or already been used. Request a fresh link and try again.
      </p>
      <Button asChild size="lg" className="mt-7 w-full">
        <Link href="/auth/forgot-password">Request a new link</Link>
      </Button>
    </section>
  );
}
