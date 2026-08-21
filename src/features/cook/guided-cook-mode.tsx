"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  CookingPot,
  ExternalLink,
  Flame,
  LoaderCircle,
  PackageOpen,
  PlayCircle,
  Scale,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateCookSessionAction } from "@/features/cook/actions";
import {
  formatScaledQuantity,
  scaleIngredientQuantity,
} from "@/features/cook/scale";
import { cookStepCopy } from "@/features/cook/step-copy";
import type { RecipeCatalogueItem } from "@/features/recipes/data";
import { buildYouTubeTutorialSearchUrl } from "@/features/watch-cook/youtube-search";

interface GuidedCookModeProps {
  recipe: RecipeCatalogueItem;
  servings: number;
  initialStep: number;
  initialCompletedSteps: number[];
}

function sentenceCase(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

function formatIngredientAmount(quantity: number, unit: string) {
  const fractions = new Map([
    [0.25, "1/4"],
    [0.5, "1/2"],
    [0.75, "3/4"],
  ]);
  const formatted = fractions.get(quantity) ?? formatScaledQuantity(quantity);
  return unit === "piece" ? formatted : `${formatted} ${unit}`;
}

function formatHeatSource(value: string | undefined) {
  if (!value) return "Medium heat";
  const label = value.replaceAll("_", " ");
  return sentenceCase(label === "gas cooker" ? "Medium heat" : label);
}

export function GuidedCookMode({
  recipe,
  servings,
  initialStep,
  initialCompletedSteps,
}: GuidedCookModeProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState(
    new Set(initialCompletedSteps),
  );
  const [message, setMessage] = useState(
    "Your progress is saved after every action.",
  );
  const [wakeActive, setWakeActive] = useState(false);
  const [pending, startTransition] = useTransition();
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const totalSteps = recipe.instructions.length;
  const instruction = recipe.instructions[currentStep - 1];
  const currentCopy = cookStepCopy(instruction);
  const nextInstruction = recipe.instructions[currentStep] ?? null;
  const nextCopy = nextInstruction ? cookStepCopy(nextInstruction) : null;
  const currentComplete = completedSteps.has(currentStep);
  const progress = Math.round((currentStep / totalSteps) * 100);
  const stepMinutes = Math.max(1, Math.round(recipe.cookMinutes / totalSteps));
  const tutorialUrl = buildYouTubeTutorialSearchUrl({
    recipeName: recipe.name,
    language: "english",
    maxMinutes: Math.min(120, Math.max(10, recipe.totalMinutes)),
    skill: recipe.difficulty as "easy" | "moderate",
    equipment: recipe.acceptedHeatSources[0] ?? recipe.requiredEquipment[0],
    dietaryTerms: recipe.dietaryTags,
  });

  function navigate(nextStep: number) {
    if (pending || nextStep < 1 || nextStep > totalSteps) return;
    startTransition(async () => {
      const result = await updateCookSessionAction({
        operation: "navigate",
        recipeId: recipe.id,
        currentStep: nextStep,
      });
      if (result.status === "success") {
        setCurrentStep(nextStep);
        setMessage(`Step ${nextStep} ready. Progress saved.`);
      } else setMessage(result.message ?? "Progress could not be saved.");
    });
  }

  function saveCurrentStep(completed: boolean, nextStep?: number) {
    if (pending) return;
    startTransition(async () => {
      const result = await updateCookSessionAction({
        operation: "step",
        recipeId: recipe.id,
        stepNumber: currentStep,
        currentStep: nextStep,
        completed,
      });
      if (result.status === "success") {
        setCompletedSteps((current) => {
          const updated = new Set(current);
          if (completed) updated.add(currentStep);
          else updated.delete(currentStep);
          return updated;
        });
        if (nextStep) setCurrentStep(nextStep);
        setMessage(
          nextStep
            ? `Step ${nextStep} ready. Progress saved.`
            : completed
              ? "Step marked complete."
              : "Step marked not done.",
        );
      } else setMessage(result.message ?? "Progress could not be saved.");
    });
  }

  function finishMeal() {
    if (pending) return;
    startTransition(async () => {
      if (!currentComplete) {
        const stepResult = await updateCookSessionAction({
          operation: "step",
          recipeId: recipe.id,
          stepNumber: currentStep,
          currentStep,
          completed: true,
        });
        if (stepResult.status !== "success") {
          setMessage(
            stepResult.message ?? "The final step could not be saved.",
          );
          return;
        }
      }
      const result = await updateCookSessionAction({
        operation: "complete",
        recipeId: recipe.id,
      });
      if (result.status === "success") router.push("/cook?completed=1");
      else setMessage(result.message ?? "The meal could not be completed.");
    });
  }

  async function toggleWakeLock() {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
      setWakeActive(false);
      setMessage("Screen wake lock released.");
      return;
    }
    if (!("wakeLock" in navigator)) {
      setMessage("Screen wake lock is not supported in this browser.");
      return;
    }
    try {
      wakeLock.current = await navigator.wakeLock.request("screen");
      setWakeActive(true);
      setMessage("Screen will stay awake while this tab remains visible.");
    } catch {
      setMessage("The screen wake lock could not be enabled.");
    }
  }

  const status = (
    <span className="inline-flex items-center gap-2 rounded-lg border border-border/75 bg-card px-3 py-2 text-xs font-medium text-primary">
      <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
      {currentComplete ? "Complete" : "In progress"}
    </span>
  );

  return (
    <div data-cook-detail>
      <section className="border-b border-border/55 bg-[linear-gradient(105deg,#fffafa_0%,#fbf0f2_58%,#fffafa_100%)] px-5 py-7 sm:px-12 sm:py-9 xl:px-12 xl:py-7">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">
          Cook
        </p>
        <h1 className="mt-2 max-w-4xl font-display text-[2.45rem] font-semibold leading-[0.98] tracking-tight sm:text-6xl xl:text-5xl">
          One clear step at a time.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8 xl:text-lg">
          BiteWise keeps your place while you cook and helps you move through
          each step with confidence.
        </p>
      </section>

      <div className="space-y-4 px-4 py-4 sm:px-12 sm:py-5 xl:px-10 xl:py-4">
        <section
          aria-label="Recipe progress"
          className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-4 rounded-2xl border border-border bg-card p-3 shadow-[0_12px_35px_-30px_rgba(91,23,51,0.45)] sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:p-4"
        >
          <div className="relative row-span-2 h-[4.75rem] overflow-hidden rounded-xl bg-secondary sm:h-[5.25rem]">
            {recipe.image ? (
              <Image
                src={recipe.image.path}
                alt={recipe.image.alt}
                fill
                preload
                sizes="(max-width: 639px) 88px, 144px"
                className="object-cover"
              />
            ) : (
              <CookingPot
                className="absolute inset-0 m-auto size-8 text-primary"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0 self-end">
            <h2 className="truncate font-display text-lg font-semibold sm:text-2xl">
              {recipe.name}
            </h2>
          </div>
          <div className="row-span-2 hidden items-center gap-7 sm:flex">
            {status}
            <ChevronDown
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="self-start pt-1">
            <div className="flex items-center gap-4">
              <span className="shrink-0 text-sm font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <div
                className="h-1.5 w-full max-w-64 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Cooking progress"
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-valuenow={currentStep}
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-4 xl:grid-cols-[23rem_minmax(0,1fr)]">
          <aside
            aria-label="Cooking tools and ingredients"
            className="order-2 space-y-3 xl:order-1"
          >
            <section
              aria-labelledby="scaled-ingredients"
              className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_12px_35px_-30px_rgba(91,23,51,0.45)]"
            >
              <h2
                id="scaled-ingredients"
                className="flex items-center gap-3 font-display text-xl font-semibold"
              >
                <Scale className="size-5 text-primary" aria-hidden="true" />
                Scaled for {servings}
              </h2>
              <ul className="mt-2 divide-y divide-border/75">
                {recipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="flex min-h-10 items-center justify-between gap-4 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-3 font-medium">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                        <PackageOpen className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="truncate">{ingredient.name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {formatIngredientAmount(
                        scaleIngredientQuantity(
                          ingredient.quantity,
                          recipe.baseServings,
                          servings,
                        ),
                        ingredient.unit,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-label="Cooking options"
              className="overflow-hidden rounded-2xl border border-border bg-card px-4 shadow-[0_12px_35px_-30px_rgba(91,23,51,0.45)]"
            >
              <button
                type="button"
                role="switch"
                aria-checked={wakeActive}
                onClick={toggleWakeLock}
                className="flex min-h-14 w-full items-center gap-3 border-b border-border/75 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <Sun className="size-5 text-foreground" aria-hidden="true" />
                <span className="flex-1">Keep screen awake</span>
                <span
                  className={`relative h-7 w-12 rounded-full transition-colors ${wakeActive ? "bg-primary" : "bg-muted"}`}
                  aria-hidden="true"
                >
                  <span
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${wakeActive ? "translate-x-6" : "translate-x-1"}`}
                  />
                </span>
              </button>
              <a
                href={tutorialUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-14 items-center gap-3 border-b border-border/75 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <PlayCircle className="size-5" aria-hidden="true" />
                <span className="flex-1">Watch tutorial on YouTube</span>
                <ExternalLink
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <Link
                href={`/recipes/${recipe.slug}`}
                className="flex min-h-14 items-center gap-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <BookOpen className="size-5" aria-hidden="true" />
                <span className="flex-1">Recipe overview</span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </section>
          </aside>

          <section
            aria-labelledby="current-cook-step"
            className="order-1 xl:order-2"
          >
            <div className="min-h-[23rem] rounded-2xl border border-border bg-card p-5 shadow-[0_18px_46px_-38px_rgba(91,23,51,0.45)] sm:p-8 xl:min-h-[32rem] xl:p-10">
              <div className="flex items-start justify-between gap-4">
                <p className="font-display text-xl font-semibold text-primary sm:text-2xl">
                  Step {currentStep} of {totalSteps}
                </p>
                {status}
              </div>
              <div className="mt-7 grid gap-6 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center xl:mt-10">
                <span className="grid size-28 place-items-center rounded-full bg-[#fff0e7] text-[#9a4f16] sm:size-32">
                  <CookingPot
                    className="size-14 stroke-[1.5]"
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <h2
                    id="current-cook-step"
                    className="font-display text-4xl font-semibold leading-none tracking-tight sm:text-5xl"
                  >
                    {currentCopy.title}
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                    {currentCopy.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground sm:text-base">
                    <span className="flex items-center gap-2">
                      <Clock3 className="size-5" aria-hidden="true" />~
                      {stepMinutes} min
                    </span>
                    <span className="h-6 w-px bg-border" aria-hidden="true" />
                    <span className="flex items-center gap-2">
                      <Flame className="size-5" aria-hidden="true" />
                      {formatHeatSource(recipe.acceptedHeatSources[0])}
                    </span>
                  </div>
                  {nextCopy ? (
                    <div className="mt-7 flex items-center gap-4 border-t border-border pt-5 sm:mt-8 sm:pt-6">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fff0e7] text-[#9a4f16]">
                        <CookingPot
                          className="size-6 stroke-[1.5]"
                          aria-hidden="true"
                        />
                      </span>
                      <p className="font-display text-base font-semibold sm:text-lg">
                        <span className="text-primary">Next:</span>{" "}
                        {nextCopy.title}.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-7 flex items-center gap-3 border-t border-border pt-5 font-display text-lg font-semibold text-primary">
                      <Check className="size-5" aria-hidden="true" />
                      Next: serve and enjoy.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="grid gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-[0_12px_38px_-22px_rgba(91,23,51,0.45)] backdrop-blur-xl sm:grid-cols-[15rem_minmax(0,1fr)] xl:sticky xl:bottom-3 xl:z-20 xl:grid-cols-[13rem_minmax(0,1fr)_20rem]">
          <Button
            type="button"
            variant="outline"
            className="min-h-14 justify-center text-base"
            disabled={pending || currentStep === 1}
            onClick={() => navigate(currentStep - 1)}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Previous
          </Button>
          <p
            aria-live="polite"
            className="hidden items-center justify-center gap-2 text-center text-sm text-muted-foreground xl:flex"
          >
            <span className="grid size-6 place-items-center rounded-full bg-secondary text-primary">
              <Check className="size-3.5" aria-hidden="true" />
            </span>
            {pending ? "Saving progress..." : message}
          </p>
          {currentStep < totalSteps ? (
            <Button
              type="button"
              className="min-h-14 justify-center text-base sm:text-lg"
              disabled={pending}
              onClick={() =>
                currentComplete
                  ? navigate(currentStep + 1)
                  : saveCurrentStep(true, currentStep + 1)
              }
            >
              {pending ? (
                <LoaderCircle
                  className="size-5 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              Complete step &amp; continue
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-14 justify-center text-base sm:text-lg"
              disabled={pending}
              onClick={finishMeal}
            >
              {pending ? (
                <LoaderCircle
                  className="size-5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Check className="size-5" aria-hidden="true" />
              )}
              Finish meal
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
