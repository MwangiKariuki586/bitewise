"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Flame, LoaderCircle, MonitorUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateCookSessionAction } from "@/features/cook/actions";
import { formatScaledQuantity, scaleIngredientQuantity } from "@/features/cook/scale";
import type { RecipePersonalisationState } from "@/features/personalisation/data";
import { RecipePersonalisationControls } from "@/features/personalisation/controls";
import type { RecipeCatalogueItem } from "@/features/recipes/data";
import { buildYouTubeTutorialSearchUrl } from "@/features/watch-cook/youtube-search";

interface GuidedCookModeProps {
  recipe: RecipeCatalogueItem;
  servings: number;
  initialStep: number;
  initialCompletedSteps: number[];
  personalisation: RecipePersonalisationState;
}

export function GuidedCookMode({
  recipe,
  servings,
  initialStep,
  initialCompletedSteps,
  personalisation,
}: GuidedCookModeProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState(new Set(initialCompletedSteps));
  const [message, setMessage] = useState("Your progress is saved after every action.");
  const [wakeActive, setWakeActive] = useState(false);
  const [pending, startTransition] = useTransition();
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const totalSteps = recipe.instructions.length;
  const instruction = recipe.instructions[currentStep - 1];
  const currentComplete = completedSteps.has(currentStep);
  const progress = Math.round((completedSteps.size / totalSteps) * 100);
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
      } else {
        setMessage(result.message ?? "Progress could not be saved.");
      }
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
        setMessage(nextStep ? `Step ${nextStep} ready. Progress saved.` : completed ? "Step marked complete." : "Step marked not done.");
      } else {
        setMessage(result.message ?? "Progress could not be saved.");
      }
    });
  }

  function finishMeal() {
    if (pending) return;
    startTransition(async () => {
      const result = await updateCookSessionAction({ operation: "complete", recipeId: recipe.id });
      if (result.status === "success") {
        router.push("/cook?completed=1");
      } else {
        setMessage(result.message ?? "The meal could not be completed.");
      }
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

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="overflow-hidden rounded-[2rem] bg-primary px-5 py-7 text-primary-foreground shadow-[0_24px_65px_-36px_rgba(17,55,39,0.9)] sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Cook Mode · {servings} servings</p>
            <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{recipe.name}</h1>
          </div>
          <Badge className="bg-white/12 text-primary-foreground ring-1 ring-white/15">{completedSteps.size} of {totalSteps} complete</Badge>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Cooking progress" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={completedSteps.size}>
          <div className="h-full rounded-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <Card className="p-4 sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">Shape future meal ideas</p>
        <RecipePersonalisationControls recipeId={recipe.id} initialState={personalisation} authenticated compact />
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside aria-label="Scaled ingredients" className="rounded-[1.5rem] bg-card p-5 shadow-sm ring-1 ring-border/55 lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Scaled for {servings}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Ingredients</h2>
          <ul className="mt-4 divide-y divide-border/55">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <span className="font-medium">{ingredient.name}</span>
                <span className="shrink-0 font-bold text-primary">{formatScaledQuantity(scaleIngredientQuantity(ingredient.quantity, recipe.baseServings, servings))} {ingredient.unit}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid gap-2">
            <Button type="button" variant={wakeActive ? "default" : "outline"} onClick={toggleWakeLock} className="min-h-12">
              <MonitorUp className="size-4" aria-hidden="true" />{wakeActive ? "Let screen sleep" : "Keep screen awake"}
            </Button>
            <Button asChild variant="ghost" className="min-h-12">
              <a href={tutorialUrl} target="_blank" rel="noreferrer">Watch tutorial search<ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
            </Button>
          </div>
        </aside>

        <section aria-labelledby="current-cook-step" className="space-y-4">
          <Card className="min-h-[24rem] p-5 shadow-[0_20px_60px_-42px_rgba(24,64,45,0.8)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Step {currentStep} of {totalSteps}</p>
              {currentComplete ? <Badge className="bg-primary text-primary-foreground"><Check className="mr-1 size-4" aria-hidden="true" />Done</Badge> : <Badge className="bg-secondary text-secondary-foreground">In progress</Badge>}
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:items-start">
              <span className="grid size-16 place-items-center rounded-full bg-accent font-display text-3xl font-semibold text-accent-foreground sm:size-18"><Flame className="size-7" aria-hidden="true" /></span>
              <div>
                <h2 id="current-cook-step" className="font-display text-3xl font-semibold leading-tight sm:text-4xl">Focus on this step</h2>
                <p className="mt-4 text-lg leading-8 sm:text-xl sm:leading-9">{instruction}</p>
              </div>
            </div>
          </Card>

          <p aria-live="polite" className="min-h-6 text-center text-sm font-medium text-muted-foreground">{pending ? "Saving progress..." : message}</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[auto_1fr_auto]">
            <Button type="button" variant="outline" className="min-h-14" disabled={pending || currentStep === 1} onClick={() => navigate(currentStep - 1)}>
              <ArrowLeft className="size-5" aria-hidden="true" />Previous
            </Button>
            <Button type="button" variant={currentComplete ? "outline" : "secondary"} className="min-h-14 sm:order-none" disabled={pending} onClick={() => saveCurrentStep(!currentComplete)}>
              {currentComplete ? "Mark not done" : "Mark step done"}
            </Button>
            {currentStep < totalSteps ? (
              <Button type="button" className="col-span-2 min-h-14 sm:col-span-1" disabled={pending} onClick={() => currentComplete ? navigate(currentStep + 1) : saveCurrentStep(true, currentStep + 1)}>
                {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : null}Next<ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" className="col-span-2 min-h-14 sm:col-span-1" disabled={pending || completedSteps.size !== totalSteps} onClick={finishMeal}>
                {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Check className="size-5" aria-hidden="true" />}Finish meal
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
