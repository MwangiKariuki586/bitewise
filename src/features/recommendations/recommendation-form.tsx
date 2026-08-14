"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ChefHat, ChevronDown, Clock3, Coins, ListFilter, LoaderCircle, PackageCheck, RefreshCw, ShoppingBasket, SlidersHorizontal, Sparkles, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipePersonalisationControls } from "@/features/personalisation/controls";
import { dietaryOptions, equipmentOptions } from "@/features/profile/options";
import { generateRecommendationsAction } from "@/features/recommendations/actions";
import type { RecommendationResponse } from "@/features/recommendations/data";
import type { RecommendedMeal } from "@/features/recommendations/ranking";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

interface RecommendationFormProps {
  defaults: {
    budgetKes: number;
    servings: number;
    maxMinutes: number;
    equipment: string[];
    dietaryPreferences: string[];
  };
}

interface ActiveConstraints {
  budgetKes: number;
  servings: number;
  maxMinutes: number;
  mealType: string;
  equipment: string[];
  dietaryPreferences: string[];
}

type SortOption = "best" | "cost" | "time" | "pantry";

interface StoredEatNowState {
  version: 1;
  result: ActionResult<RecommendationResponse>;
  constraints: ActiveConstraints;
  sort: SortOption;
  scrollY: number;
}

const storageKey = "bitewise:eat-now-state";
const storageVersion = 1;
const initialState: ActionResult<RecommendationResponse> = { status: "idle" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredEatNowState(value: unknown): value is StoredEatNowState {
  if (!isRecord(value) || value.version !== storageVersion) return false;
  if (!isRecord(value.result) || value.result.status !== "success") return false;
  if (!isRecord(value.result.data) || !Array.isArray(value.result.data.meals)) return false;
  if (!isRecord(value.constraints)) return false;

  const { constraints } = value;
  return (
    typeof constraints.budgetKes === "number" &&
    Number.isFinite(constraints.budgetKes) &&
    typeof constraints.servings === "number" &&
    Number.isFinite(constraints.servings) &&
    typeof constraints.maxMinutes === "number" &&
    Number.isFinite(constraints.maxMinutes) &&
    typeof constraints.mealType === "string" &&
    Array.isArray(constraints.equipment) &&
    constraints.equipment.every((item) => typeof item === "string") &&
    Array.isArray(constraints.dietaryPreferences) &&
    constraints.dietaryPreferences.every((item) => typeof item === "string") &&
    ["best", "cost", "time", "pantry"].includes(String(value.sort)) &&
    typeof value.scrollY === "number" &&
    Number.isFinite(value.scrollY)
  );
}

function formatKes(minor: number) {
  return `KES ${Math.ceil(minor / 100).toLocaleString("en-KE")}`;
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="text-xs font-medium text-destructive">{errors[0]}</p> : null;
}

function Metric({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/7 text-primary">{children}</span>
      <span className="min-w-0">
        <span className="block truncate text-foreground">{value}</span>
        <span className="block truncate text-[0.62rem] font-medium text-muted-foreground">{label}</span>
      </span>
    </span>
  );
}

function RecommendationCard({
  meal,
  index,
  rememberScroll,
}: {
  meal: RecommendedMeal & { personalisation: RecommendationResponse["meals"][number]["personalisation"] };
  index: number;
  rememberScroll: () => void;
}) {
  return (
    <Card className="overflow-hidden p-2.5 sm:p-3">
      <div className="grid gap-3 sm:grid-cols-[10.5rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)_12rem] xl:grid-cols-[13rem_minmax(0,1fr)_13rem]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-secondary sm:aspect-auto sm:min-h-40 lg:min-h-36">
          {meal.image ? (
            <Image src={meal.image.path} alt={meal.image.alt} fill sizes="(max-width: 639px) 92vw, 208px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Image unavailable</div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[0.68rem] font-bold text-primary-foreground shadow-sm">Match {index + 1}</span>
        </div>
        <div className="flex min-w-0 flex-col py-1">
          <h3 className="font-display text-[1.4rem] font-semibold leading-tight tracking-tight lg:text-[1.5rem]">{meal.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm">{meal.summary}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-auto sm:pt-3">
            <Metric label="Est. cost" value={formatKes(meal.affordableCostMinor)}><Coins className="size-3.5" aria-hidden="true" /></Metric>
            <Metric label="Prep time" value={`${meal.totalMinutes} min`}><Clock3 className="size-3.5" aria-hidden="true" /></Metric>
            <Metric label="Difficulty" value={meal.difficulty}><ChefHat className="size-3.5" aria-hidden="true" /></Metric>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
            <PackageCheck className="mb-1 size-4" aria-hidden="true" />From pantry<br />{meal.pantryIngredientNames.length} items
          </div>
          <div className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-950">
            <ShoppingBasket className="mb-1 size-4 text-orange-600" aria-hidden="true" />Missing<br />{meal.missingIngredients.length} items
          </div>
          <Button asChild className="col-span-2 lg:mt-auto">
            <Link href={`/recipes/${meal.slug}`} scroll={false} onClick={rememberScroll}>View details <span aria-hidden="true">→</span></Link>
          </Button>
        </div>
      </div>
      <div className="mt-2 border-t border-border/55 pt-2 lg:pl-[13rem] xl:pl-[14rem]">
        <RecipePersonalisationControls recipeId={meal.id} initialState={meal.personalisation} authenticated compact />
      </div>
    </Card>
  );
}

export function RecommendationForm({ defaults }: RecommendationFormProps) {
  const [state, setState] = useState<ActionResult<RecommendationResponse>>(initialState);
  const [expanded, setExpanded] = useState(true);
  const [sort, setSort] = useState<SortOption>("best");
  const [constraints, setConstraints] = useState<ActiveConstraints>({
    budgetKes: defaults.budgetKes,
    servings: defaults.servings,
    maxMinutes: defaults.maxMinutes,
    mealType: "",
    equipment: defaults.equipment,
    dietaryPreferences: defaults.dietaryPreferences,
  });
  const [pending, startTransition] = useTransition();
  const restoreScroll = useRef<number | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const scrollToResultsAfterSuccess = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return;
    let active = true;
    try {
      const stored: unknown = JSON.parse(raw);
      if (isStoredEatNowState(stored)) {
        queueMicrotask(() => {
          if (!active) return;
          setState(stored.result);
          setConstraints(stored.constraints);
          setSort(stored.sort);
          setExpanded(false);
          restoreScroll.current = stored.scrollY;
        });
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (restoreScroll.current === null || state.status !== "success") return;
    const scrollY = restoreScroll.current;
    restoreScroll.current = null;
    requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "instant" }));
  }, [state]);

  useEffect(() => {
    if (
      pending ||
      state.status !== "success" ||
      !scrollToResultsAfterSuccess.current
    ) {
      return;
    }
    scrollToResultsAfterSuccess.current = false;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }, [pending, state]);

  function persist(scrollY = window.scrollY, nextSort = sort) {
    if (state.status !== "success") return;
    sessionStorage.setItem(storageKey, JSON.stringify({ version: storageVersion, result: state, constraints, sort: nextSort, scrollY } satisfies StoredEatNowState));
  }

  function submit(formData: FormData) {
    const nextConstraints: ActiveConstraints = {
      budgetKes: Number(formData.get("budgetKes")),
      servings: Number(formData.get("servings")),
      maxMinutes: Number(formData.get("maxMinutes")),
      mealType: String(formData.get("mealType") ?? ""),
      equipment: formData.getAll("equipment").map(String),
      dietaryPreferences: formData.getAll("dietaryPreferences").map(String),
    };
    startTransition(async () => {
      const result = await generateRecommendationsAction(state, formData);
      if (result.status === "success") {
        scrollToResultsAfterSuccess.current = true;
        setConstraints(nextConstraints);
        setExpanded(false);
        sessionStorage.setItem(storageKey, JSON.stringify({ version: storageVersion, result, constraints: nextConstraints, sort, scrollY: 0 } satisfies StoredEatNowState));
      } else {
        setExpanded(true);
      }
      setState(result);
    });
  }

  const meals = useMemo(() => {
    if (state.status !== "success" || !state.data) return [];
    return [...state.data.meals].sort((left, right) => {
      if (sort === "cost") return left.affordableCostMinor - right.affordableCostMinor;
      if (sort === "time") return left.totalMinutes - right.totalMinutes;
      if (sort === "pantry") return right.pantryCoveragePercent - left.pantryCoveragePercent;
      return right.score - left.score;
    });
  }, [sort, state]);

  const mealTypeLabel = constraints.mealType
    ? constraints.mealType[0].toUpperCase() + constraints.mealType.slice(1)
    : "Any meal";

  return (
    <div className="space-y-7">
      <section className="rounded-[1.5rem] bg-card p-4 ring-1 ring-border/65 sm:p-5" aria-labelledby="constraints-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="constraints-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Today&apos;s constraints</h2>
          {state.status === "success" ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
              {expanded ? "Done" : "Edit"} <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
            </Button>
          ) : null}
        </div>

        {!expanded && state.status === "success" ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <span className="constraint-chip"><Coins className="size-4" />KES {constraints.budgetKes.toLocaleString("en-KE")}</span>
            <span className="constraint-chip"><UsersRound className="size-4" />{constraints.servings} servings</span>
            <span className="constraint-chip"><Clock3 className="size-4" />{constraints.maxMinutes} min</span>
            <span className="constraint-chip"><ChefHat className="size-4" />{mealTypeLabel}</span>
            <span className="constraint-chip col-span-2">
              <SlidersHorizontal className="size-4" />More constraints
              <span className="sr-only">: {constraints.equipment.join(", ") || "no equipment"}; {constraints.dietaryPreferences.join(", ") || "no dietary preferences"}</span>
            </span>
          </div>
        ) : (
          <form action={submit} className="mt-4 space-y-4">
            {defaults.dietaryPreferences.map((value) => <input key={value} type="hidden" name="dietaryPreferences" value={value} />)}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="space-y-1.5"><Label htmlFor="budgetKes">Meal budget (KES)</Label><Input id="budgetKes" name="budgetKes" type="number" min="100" max="1000000" defaultValue={constraints.budgetKes} aria-describedby="pricing-context" /><FieldError errors={state.fieldErrors?.budgetKes} /></div>
              <div className="space-y-1.5"><Label htmlFor="servings">Servings</Label><Input id="servings" name="servings" type="number" min="1" max="30" defaultValue={constraints.servings} /><FieldError errors={state.fieldErrors?.servings} /></div>
              <div className="space-y-1.5"><Label htmlFor="maxMinutes">Time available</Label><Input id="maxMinutes" name="maxMinutes" type="number" min="5" max="480" defaultValue={constraints.maxMinutes} /><FieldError errors={state.fieldErrors?.maxMinutes} /></div>
              <div className="space-y-1.5"><Label htmlFor="mealType">Meal type</Label><div className="relative"><select id="mealType" name="mealType" defaultValue={constraints.mealType} className="h-12 w-full appearance-none rounded-xl bg-background px-3 pr-8 text-sm ring-1 ring-input"><option value="">Any meal</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" /></div></div>
            </div>
            <details className="group rounded-xl bg-secondary/35 px-3 ring-1 ring-border/60" open={Boolean(state.fieldErrors?.equipment?.length || state.fieldErrors?.dietaryPreferences?.length)}>
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-sm font-bold">More constraints <ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary>
              <div className="grid gap-4 border-t border-border/60 py-4 lg:grid-cols-2">
                <fieldset><legend className="text-sm font-semibold">Equipment available today</legend><div className="mt-2 grid grid-cols-2 gap-2">{equipmentOptions.map((option) => <label key={option.value} className="flex min-h-11 items-center gap-2 rounded-xl bg-background px-3 text-xs font-semibold has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"><input name="equipment" type="checkbox" value={option.value} defaultChecked={constraints.equipment.includes(option.value)} className="size-4 accent-current" />{option.label}</label>)}</div><FieldError errors={state.fieldErrors?.equipment} /></fieldset>
                <fieldset>
                  <legend className="text-sm font-semibold">Dietary needs</legend>
                  {defaults.dietaryPreferences.length ? <div className="mt-2 flex flex-wrap gap-2">{dietaryOptions.filter((option) => defaults.dietaryPreferences.includes(option.value)).map((option) => <label key={option.value} className="flex min-h-9 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary"><input type="checkbox" checked disabled aria-label={`${option.label} · saved`} className="sr-only" />{option.label} · saved</label>)}</div> : null}
                  <div className="mt-2 grid grid-cols-2 gap-2">{dietaryOptions.filter((option) => !defaults.dietaryPreferences.includes(option.value)).map((option) => <label key={option.value} className="flex min-h-11 items-center gap-2 rounded-xl bg-background px-3 text-xs font-semibold has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"><input name="dietaryPreferences" type="checkbox" value={option.value} defaultChecked={constraints.dietaryPreferences.includes(option.value)} className="size-4 accent-current" />{option.label}</label>)}</div><FieldError errors={state.fieldErrors?.dietaryPreferences} />
                </fieldset>
              </div>
            </details>
            {state.status === "error" ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{state.message}</p> : null}
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-center">
              <Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : state.status === "success" ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}{pending ? "Finding meals…" : state.status === "success" ? "Refresh my matches" : "Find meals that fit"}</Button>
              <p className="text-center text-xs text-muted-foreground">Up to 20 lists every 10 minutes</p>
            </div>
          </form>
        )}
      </section>

      <section ref={resultsRef} aria-labelledby="recommendation-results" aria-live="polite" aria-busy={pending} className="min-w-0 scroll-mt-[5.5rem] space-y-3 lg:scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your shortlist</p><h2 id="recommendation-results" className="mt-1 font-display text-3xl font-semibold tracking-tight">{pending ? "Checking every constraint…" : meals.length ? "Best fits first" : "Ready when you are"}</h2><p className="mt-1 text-sm text-muted-foreground">{state.status === "success" ? state.message : "Set today’s constraints to find your strongest matches."}</p></div>
          {meals.length ? <label className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">Sort by <ListFilter className="size-4 text-primary" /><select value={sort} onChange={(event) => { const nextSort = event.target.value as SortOption; setSort(nextSort); persist(window.scrollY, nextSort); }} className="h-10 rounded-xl bg-card px-3 font-semibold text-foreground ring-1 ring-border"><option value="best">Best fit</option><option value="cost">Lowest cost</option><option value="time">Quickest</option><option value="pantry">Most from pantry</option></select></label> : null}
        </div>
        {pending ? <div className="grid gap-3"><div className="h-44 animate-pulse rounded-[1.5rem] bg-muted" /><div className="h-44 animate-pulse rounded-[1.5rem] bg-muted" /></div> : null}
        {!pending && meals.map((meal, index) => <RecommendationCard key={meal.id} meal={meal} index={index} rememberScroll={() => persist()} />)}
        {!pending && state.status === "success" && state.data && !state.data.meals.length ? <Card className="p-6"><h3 className="font-display text-2xl font-semibold">Keep the hard rules. Adjust the situation.</h3><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{state.data.suggestions.map((suggestion) => <li key={suggestion}>• {suggestion}</li>)}</ul></Card> : null}
      </section>
    </div>
  );
}
