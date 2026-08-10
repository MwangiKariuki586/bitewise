"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CookErrorProps {
  reset: () => void;
}

export default function CookError({ reset }: CookErrorProps) {
  return (
    <Card className="mx-auto max-w-xl px-6 py-14 text-center" role="alert">
      <AlertTriangle className="mx-auto size-10 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 font-display text-3xl font-semibold">Cook Mode could not be loaded.</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Your last saved step is still safe. Try loading the session again.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </Card>
  );
}
