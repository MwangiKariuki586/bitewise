"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <section className="max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Something went wrong</p>
        <h1 className="mt-4 font-display text-4xl font-semibold">That did not come together as planned.</h1>
        <p className="mt-4 leading-7 text-muted-foreground">Your information is still safe. Try this step again, or return in a moment.</p>
        <Button className="mt-7" onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}
