"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import {
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Clock3,
  Coins,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBasket,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dietaryOptions, equipmentOptions } from "@/features/profile/options";
import { RecipePersonalisationControls } from "@/features/personalisation/controls";
import { generateRecommendationsAction } from "@/features/recommendations/actions";
import type { RecommendationResponse } from "@/features/recommendations/data";
import type { RecommendedMeal } from "@/features/recommendations/ranking";
import type { ActionResult } from "@/lib/action-result";

interface RecommendationFormProps {
  defaults: {
    budgetKes: number;
    servings: number;
    maxMinutes: number;
    equipment: string[];
    dietaryPreferences: string[];
  };
}

const initialState: ActionResult<RecommendationResponse> = { status: "idle" };

function formatKes(minor: number) {
  return `KES ${Math.ceil(minor / 100).toLocaleString("en-KE")}`;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs font-medium text-destructive">{errors[0]}</p>;
}

function RecommendationCard({
  meal,
  index,
}: {
  meal: RecommendedMeal & {
    personalisation: RecommendationResponse["meals"][number]["personalisation"];
  };
  index: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="relative min-h-52 overflow-hidden bg-secondary md:min-h-full">
          {meal.image ? (
            <Image
              src={meal.image.path}
              alt={meal.image.alt}
              fill
              sizes="(max-width: 767px) 92vw, 224px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Image unavailable
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm">
            Match {index + 1}
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-accent/20 text-accent-foreground">
                {meal.cuisine.replaceAll("_", " ")}
              </Badge>
              <Badge>{meal.pantryCoveragePercent}% pantry match</Badge>
            </div>
            <h3 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight">
              {meal.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{meal.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <span className="rounded-xl bg-secondary/65 p-3 text-xs font-semibold">
              <Coins className="mb-1 size-4 text-primary" aria-hidden="true" />
              {formatKes(meal.affordableCostMinor)}
            </span>
            <span className="rounded-xl bg-secondary/65 p-3 text-xs font-semibold">
              <UsersRound className="mb-1 size-4 text-primary" aria-hidden="true" />
              {formatKes(meal.estimatedCostPerServingMinor)} each
            </span>
            <span className="rounded-xl bg-secondary/65 p-3 text-xs font-semibold">
              <Clock3 className="mb-1 size-4 text-primary" aria-hidden="true" />
              {meal.totalMinutes} min
            </span>
            <span className="rounded-xl bg-secondary/65 p-3 text-xs font-semibold">
              <ChefHat className="mb-1 size-4 text-primary" aria-hidden="true" />
              {meal.difficulty}
            </span>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Why it fits
            </p>
            <ul className="mt-2 space-y-2">
              {meal.reasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-sm leading-5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <details className="rounded-2xl bg-secondary/55 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold">
                <PackageCheck className="size-4 text-primary" aria-hidden="true" />
                From your pantry ({meal.pantryIngredientNames.length})
              </summary>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {meal.pantryIngredientNames.length
                  ? meal.pantryIngredientNames.join(", ")
                  : "No required ingredient is fully or partly covered yet."}
              </p>
            </details>
            <details className="rounded-2xl bg-secondary/55 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold">
                <ShoppingBasket className="size-4 text-primary" aria-hidden="true" />
                Missing ({meal.missingIngredients.length})
              </summary>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                {meal.missingIngredients.length ? (
                  meal.missingIngredients.map((ingredient) => (
                    <li key={ingredient.ingredientId}>
                      {ingredient.name}: {ingredient.quantity.toLocaleString("en-KE")} {ingredient.unit}
                    </li>
                  ))
                ) : (
                  <li>Your pantry covers every required ingredient.</li>
                )}
              </ul>
            </details>
          </div>

          {meal.substitutions.length ? (
            <div className="rounded-2xl bg-accent/12 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent-foreground">
                Cheaper approved swap
              </p>
              {meal.substitutions.slice(0, 2).map((substitution) => (
                <p key={`${substitution.sourceIngredient}-${substitution.alternativeIngredient}`} className="mt-2 text-sm leading-5">
                  Use {substitution.quantity.toLocaleString("en-KE")} {substitution.unit} {substitution.alternativeIngredient} instead of {substitution.sourceIngredient}; save about {formatKes(substitution.estimatedSavingMinor)}.
                </p>
              ))}
            </div>
          ) : null}

          {meal.image ? (
            <p className="text-xs text-muted-foreground">
              Photo by{" "}
              <a className="font-semibold underline-offset-4 hover:underline" href={meal.image.attributionUrl} target="_blank" rel="noreferrer">
                {meal.image.attributionName}
              </a>{" "}
              · {meal.image.licenseName}
            </p>
          ) : null}

          <RecipePersonalisationControls
            recipeId={meal.id}
            initialState={meal.personalisation}
            authenticated
            compact
          />
        </div>
      </div>
    </Card>
  );
}

export function RecommendationForm({ defaults }: RecommendationFormProps) {
  const [state, formAction, pending] = useActionState(
    generateRecommendationsAction,
    initialState,
  );

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <form action={formAction} className="space-y-3 rounded-[1.5rem] bg-card p-4 shadow-[0_18px_45px_-32px_rgba(45,39,27,0.45)] ring-1 ring-border/65 sm:space-y-4 sm:p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Today&apos;s constraints
          </h2>
          <Link
            href="/onboarding?returnTo=/eat-now"
            className="min-h-9 px-2 py-2 text-xs font-bold text-primary outline-none hover:underline focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
          >
            Edit
          </Link>
        </div>

        {defaults.dietaryPreferences.map((value) => (
          <input key={value} type="hidden" name="dietaryPreferences" value={value} />
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="budgetKes">Meal budget (KES)</Label>
            <div className="relative">
              <Coins className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              <Input className="bg-secondary/45 pl-10" id="budgetKes" name="budgetKes" type="number" min="100" max="1000000" defaultValue={defaults.budgetKes} inputMode="numeric" aria-describedby="pricing-context" />
            </div>
            <FieldError errors={state.fieldErrors?.budgetKes} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="servings">Servings</Label>
            <div className="relative">
              <UsersRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              <Input className="bg-secondary/45 pl-10" id="servings" name="servings" type="number" min="1" max="30" defaultValue={defaults.servings} inputMode="numeric" />
            </div>
            <FieldError errors={state.fieldErrors?.servings} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxMinutes">Time available</Label>
            <div className="relative">
              <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              <Input className="bg-secondary/45 pl-10" id="maxMinutes" name="maxMinutes" type="number" min="5" max="480" defaultValue={defaults.maxMinutes} inputMode="numeric" />
            </div>
            <FieldError errors={state.fieldErrors?.maxMinutes} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mealType">Meal type</Label>
            <div className="relative">
              <ChefHat className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" aria-hidden="true" />
              <select id="mealType" name="mealType" defaultValue="" className="h-12 w-full appearance-none rounded-xl bg-secondary/45 pl-10 pr-8 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Any meal</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </div>
            <FieldError errors={state.fieldErrors?.mealType} />
          </div>
        </div>

        <details
          className="group rounded-xl bg-secondary/35 px-3 ring-1 ring-border/60"
          open={Boolean(
            state.fieldErrors?.equipment?.length ||
              state.fieldErrors?.dietaryPreferences?.length,
          )}
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>
              <span className="block">More constraints</span>
              <span className="mt-0.5 block text-[0.68rem] font-medium text-muted-foreground">Equipment, dietary needs &amp; more</span>
            </span>
            <ChevronDown className="size-4 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-4 border-t border-border/60 pb-4 pt-4">
            {defaults.dietaryPreferences.length ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Saved dietary needs</p>
                  <Link href="/onboarding?returnTo=/eat-now" className="text-xs font-bold text-primary hover:underline">Edit</Link>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {dietaryOptions
                    .filter((option) => defaults.dietaryPreferences.includes(option.value))
                    .map((option) => (
                      <label key={option.value} className="cursor-default">
                        <input type="checkbox" value={option.value} defaultChecked disabled className="peer sr-only" />
                        <span className="inline-flex min-h-8 items-center rounded-full bg-primary/10 px-2.5 text-xs font-bold text-primary">
                          {option.label} · saved
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            ) : null}
            <fieldset>
              <legend className="text-sm font-semibold">Equipment available today</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {equipmentOptions.map((option) => (
                  <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-background/80 px-3 text-xs font-semibold has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                    <input name="equipment" type="checkbox" value={option.value} defaultChecked={defaults.equipment.includes(option.value)} className="size-4 accent-current" />
                    {option.label}
                  </label>
                ))}
              </div>
              <FieldError errors={state.fieldErrors?.equipment} />
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold">Additional dietary needs</legend>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Add a temporary preference. Saved needs remain enforced.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {dietaryOptions
                  .filter((option) => !defaults.dietaryPreferences.includes(option.value))
                  .map((option) => (
                    <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-background/80 px-3 text-xs font-semibold has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                      <input name="dietaryPreferences" type="checkbox" value={option.value} className="size-4 accent-current" />
                      {option.label}
                    </label>
                  ))}
              </div>
              <FieldError errors={state.fieldErrors?.dietaryPreferences} />
            </fieldset>
          </div>
        </details>

        {state.status === "error" ? (
          <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : state.status === "success" ? <RefreshCw className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {pending ? "Finding meals…" : state.status === "success" ? "Refresh my matches" : "Find meals that fit"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Up to 20 lists every 10 minutes</p>
      </form>

      <section aria-labelledby="recommendation-results" aria-live="polite" aria-busy={pending} className="min-w-0 space-y-5">
        <div className={!pending && !state.data ? "rounded-[1.5rem] bg-card p-5 shadow-sm ring-1 ring-border/65 sm:p-6" : undefined}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your shortlist</p>
          <h2 id="recommendation-results" className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {pending ? "Checking every constraint…" : state.data?.meals.length ? "Best fits first" : "Ready when you are"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {state.data?.meals.length ? state.message : "Your strongest matches will appear here with costs, pantry use, missing ingredients, and the reasons behind the ranking."}
          </p>
        </div>

        {pending ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-[1.5rem] bg-muted" />
            ))}
          </div>
        ) : null}

        {!pending && state.data?.meals.map((meal, index) => (
          <RecommendationCard key={meal.id} meal={meal} index={index} />
        ))}

        {!pending && state.data && !state.data.meals.length ? (
          <Card className="p-6 sm:p-8">
            <h3 className="font-display text-3xl font-semibold">Keep the hard rules. Adjust the situation.</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">BiteWise did not relax your dietary needs. Try one of these specific changes:</p>
            <ul className="mt-4 space-y-3">
              {state.data.suggestions.map((suggestion) => (
                <li key={suggestion} className="flex gap-2 text-sm leading-6">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
