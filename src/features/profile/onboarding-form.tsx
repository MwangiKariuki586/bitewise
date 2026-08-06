"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileOption } from "@/features/profile/options";
import {
  cuisineOptions,
  dietaryOptions,
  equipmentOptions,
  healthGoalOptions,
} from "@/features/profile/options";
import {
  saveBasicsAction,
  saveKitchenAction,
  savePreferencesAction,
} from "@/features/profile/actions";
import { initialActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export type OnboardingStep = "basics" | "kitchen" | "preferences";

export interface ProfileDefaults {
  availableMinutes: number;
  budgetKes: number | null;
  budgetPeriod: string;
  dietaryPreferences: string[];
  displayName: string;
  equipment: string[];
  healthGoals: string[];
  householdSize: number;
  preferredCuisines: string[];
  preferredDishes: string[];
}

interface OnboardingFormProps {
  defaults: ProfileDefaults;
  returnTo: string;
  step: OnboardingStep;
}

const steps: { value: OnboardingStep; label: string }[] = [
  { value: "basics", label: "Your day" },
  { value: "kitchen", label: "Kitchen" },
  { value: "preferences", label: "Food preferences" },
];

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return <p id={id} className="text-sm font-medium text-destructive">{errors[0]}</p>;
}

function ChoiceGrid({
  defaults,
  legend,
  name,
  options,
}: {
  defaults: string[];
  legend: string;
  name: string;
  options: readonly ProfileOption[];
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="relative flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl bg-muted/65 px-3 py-2.5 text-sm font-medium transition-colors has-checked:bg-secondary has-checked:text-primary has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={defaults.includes(option.value)}
              className="peer size-4 shrink-0 accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StepProgress({ current }: { current: OnboardingStep }) {
  const currentIndex = steps.findIndex(({ value }) => value === current);
  return (
    <nav aria-label="Onboarding progress" className="mb-8">
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((item, index) => (
          <li key={item.value} aria-current={index === currentIndex ? "step" : undefined}>
            <span
              className={cn(
                "mb-2 block h-1.5 rounded-full bg-muted",
                index <= currentIndex && "bg-primary",
              )}
            />
            <span className={cn("text-xs font-semibold text-muted-foreground", index === currentIndex && "text-primary")}>
              {index < currentIndex ? <Check className="mr-1 inline size-3" aria-hidden="true" /> : null}
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function OnboardingForm({ defaults, returnTo, step }: OnboardingFormProps) {
  const action = step === "basics" ? saveBasicsAction : step === "kitchen" ? saveKitchenAction : savePreferencesAction;
  const [state, formAction, pending] = useActionState(action, initialActionResult);
  const backStep = step === "kitchen" ? "basics" : "kitchen";
  const backHref = `/onboarding?${new URLSearchParams({ step: backStep, ...(returnTo !== "/eat-now" ? { returnTo } : {}) })}`;

  return (
    <section className="mx-auto w-full max-w-2xl rounded-[1.75rem] bg-card p-5 shadow-[0_24px_70px_-38px_rgba(45,39,27,0.55)] sm:p-8">
      <StepProgress current={step} />
      <form action={formAction} className="space-y-6" noValidate>
        <input type="hidden" name="returnTo" value={returnTo} />

        {step === "basics" ? (
          <>
            <header>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 1 of 3</p>
              <h1 className="mt-2 font-display text-4xl font-semibold">What does a normal day look like?</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">These practical defaults make every suggestion more useful. You can change them anytime.</p>
            </header>
            <div className="space-y-2">
              <Label htmlFor="displayName">What should we call you?</Label>
              <Input id="displayName" name="displayName" autoComplete="name" defaultValue={defaults.displayName} aria-invalid={Boolean(state.fieldErrors?.displayName)} />
              <FieldError id="display-name-error" errors={state.fieldErrors?.displayName} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_1.3fr]">
              <div className="space-y-2">
                <Label htmlFor="budgetPeriod">Budget period</Label>
                <select id="budgetPeriod" name="budgetPeriod" defaultValue={defaults.budgetPeriod} className="h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetKes">Food budget (KES)</Label>
                <Input id="budgetKes" name="budgetKes" type="number" inputMode="numeric" min={100} max={1000000} step={100} defaultValue={defaults.budgetKes ?? ""} aria-invalid={Boolean(state.fieldErrors?.budgetKes)} />
                <FieldError id="budget-error" errors={state.fieldErrors?.budgetKes} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="householdSize">People to serve</Label>
              <Input id="householdSize" name="householdSize" type="number" inputMode="numeric" min={1} max={30} defaultValue={defaults.householdSize} aria-invalid={Boolean(state.fieldErrors?.householdSize)} />
              <FieldError id="household-error" errors={state.fieldErrors?.householdSize} />
            </div>
          </>
        ) : null}

        {step === "kitchen" ? (
          <>
            <header>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 2 of 3</p>
              <h1 className="mt-2 font-display text-4xl font-semibold">Work with the kitchen you have.</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">We’ll only recommend meals that fit your available time and equipment.</p>
            </header>
            <div className="space-y-2">
              <Label htmlFor="availableMinutes">Usual cooking time (minutes)</Label>
              <Input id="availableMinutes" name="availableMinutes" type="number" inputMode="numeric" min={5} max={480} step={5} defaultValue={defaults.availableMinutes} aria-invalid={Boolean(state.fieldErrors?.availableMinutes)} />
              <FieldError id="time-error" errors={state.fieldErrors?.availableMinutes} />
            </div>
            <ChoiceGrid legend="Equipment available" name="equipment" options={equipmentOptions} defaults={defaults.equipment} />
          </>
        ) : null}

        {step === "preferences" ? (
          <>
            <header>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 3 of 3</p>
              <h1 className="mt-2 font-display text-4xl font-semibold">Make it feel like your food.</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Dietary needs are always treated as hard safety rules. Everything else helps tune the ranking.</p>
            </header>
            <ChoiceGrid legend="Dietary needs" name="dietaryPreferences" options={dietaryOptions} defaults={defaults.dietaryPreferences} />
            <ChoiceGrid legend="Health goals" name="healthGoals" options={healthGoalOptions} defaults={defaults.healthGoals} />
            <ChoiceGrid legend="Cuisines you enjoy" name="preferredCuisines" options={cuisineOptions} defaults={defaults.preferredCuisines} />
            <div className="space-y-2">
              <Label htmlFor="preferredDishes">Favourite dishes</Label>
              <textarea id="preferredDishes" name="preferredDishes" rows={3} defaultValue={defaults.preferredDishes.join(", ")} placeholder="For example: githeri, fish stew, mukimo" className="w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-invalid={Boolean(state.fieldErrors?.preferredDishes)} />
              <p className="text-xs text-muted-foreground">Separate up to 12 dishes with commas.</p>
              <FieldError id="dishes-error" errors={state.fieldErrors?.preferredDishes} />
            </div>
          </>
        ) : null}

        {state.message ? <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">{state.message}</p> : null}

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
          {step === "basics" ? <span /> : (
            <Button asChild variant="ghost">
              <Link href={backHref}><ArrowLeft className="size-4" aria-hidden="true" />Back</Link>
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? "Saving…" : step === "preferences" ? "Finish setup" : "Save and continue"}
            {!pending ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
          </Button>
        </div>
      </form>
    </section>
  );
}
