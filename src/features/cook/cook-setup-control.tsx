"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChefHat, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getCookSetupContextAction } from "@/features/cook/actions";
import { StartSessionForm } from "@/features/cook/start-session-form";

interface CookSetupControlProps {
  authenticated: boolean;
  recipeId: number;
  recipeName: string;
  recipeSlug: string;
  returnTo?: string;
}

interface CookSetupContext {
  householdSize: number;
  hasActiveSession: boolean;
}

export function CookSetupControl({
  authenticated,
  recipeId,
  recipeName,
  recipeSlug,
  returnTo: returnToProp,
}: CookSetupControlProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<CookSetupContext | null>(null);
  const [loading, startLoading] = useTransition();
  const returnTo = returnToProp ?? `/recipes/${recipeSlug}`;

  if (!authenticated) {
    return (
      <Button asChild variant="outline" className="w-full min-w-0 px-2 sm:px-4">
        <Link href={`/auth/sign-in?${new URLSearchParams({ next: returnTo })}`}>Start cooking</Link>
      </Button>
    );
  }

  function prepareCookMode() {
    startLoading(async () => {
      const result = await getCookSetupContextAction(recipeId);
      if (result.status !== "success" || !result.data) {
        toast.error(result.message ?? "Cook Mode could not be prepared.");
        return;
      }
      if (result.data.hasActiveSession) {
        router.push(`/cook/${recipeId}`);
        return;
      }
      setContext(result.data);
      setOpen(true);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full min-w-0 px-2 sm:px-4"
        disabled={loading}
        onClick={prepareCookMode}
      >
        {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {loading ? "Preparing..." : "Start cooking"}
      </Button>

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setContext(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-[1.75rem] bg-card p-5 shadow-2xl focus:outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <ChefHat className="size-5" aria-hidden="true" />
                </span>
                <Dialog.Title className="mt-4 font-display text-2xl font-semibold">
                  Start cooking {recipeName}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose servings before you begin. Ingredients will scale and your completed steps will be saved.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" className="size-9 min-h-9 shrink-0" aria-label="Close cook setup">
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </Dialog.Close>
            </div>

            {context ? (
              <div className="mt-6">
                <StartSessionForm
                  recipeId={recipeId}
                  defaultServings={context.householdSize}
                  submitLabel="Begin cooking"
                />
                <Dialog.Close asChild>
                  <Button type="button" variant="ghost" className="mt-2 w-full">Cancel</Button>
                </Dialog.Close>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
