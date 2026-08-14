"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CalendarPlus, Check, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  addRecipeToMealPlanAction,
  getAddToMealPlanContextAction,
  type AddToMealPlanContext,
} from "@/features/meal-plan/actions";
import { weekDayDate } from "@/features/meal-plan/dates";
import type { MealType } from "@/features/meal-plan/schemas";
import { cn } from "@/lib/utils";

interface AddToMealPlanControlProps {
  authenticated: boolean;
  recipeId: number;
  recipeName: string;
  recipeSlug: string;
}

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function dayLabel(weekStart: string, dayOfWeek: number) {
  const date = weekDayDate(weekStart, dayOfWeek);
  return new Intl.DateTimeFormat("en-KE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

function sentenceLabel(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

export function AddToMealPlanControl({ authenticated, recipeId, recipeName, recipeSlug }: AddToMealPlanControlProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AddToMealPlanContext | null>(null);
  const [message, setMessage] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [servings, setServings] = useState(1);
  const [replacementConfirmed, setReplacementConfirmed] = useState(false);
  const [loading, startLoading] = useTransition();
  const [saving, startSaving] = useTransition();
  const returnTo = `/recipes/${recipeSlug}`;

  const selectedWeek = context?.weeks.find((week) => week.weekStart === weekStart) ?? null;
  const occupiedSlot = selectedWeek?.slots.find((slot) => slot.dayOfWeek === dayOfWeek && slot.mealType === mealType) ?? null;
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => index), []);

  if (!authenticated) {
    return <Button asChild className="w-full min-w-0 px-2 sm:px-4"><Link href={`/auth/sign-in?${new URLSearchParams({ next: returnTo })}`}>Add to meal plan</Link></Button>;
  }

  function openPicker() {
    setOpen(true);
    setMessage("");
    if (context) return;
    startLoading(async () => {
      const result = await getAddToMealPlanContextAction(recipeId);
      if (result.status !== "success" || !result.data) {
        setMessage(result.message ?? "Your meal plan could not be loaded.");
        return;
      }
      setContext(result.data);
      setWeekStart(result.data.weeks[0].weekStart);
      setDayOfWeek(result.data.currentDayOfWeek);
      setMealType(result.data.mealTypes[0]);
      setServings(result.data.householdSize);
    });
  }

  function chooseWeek(value: string) {
    setWeekStart(value);
    const week = context?.weeks.find((item) => item.weekStart === value);
    setDayOfWeek(week?.label === "This week" ? (context?.currentDayOfWeek ?? 0) : 0);
    setReplacementConfirmed(false);
    setMessage("");
  }

  function submit() {
    if (!context || !selectedWeek) return;
    if (occupiedSlot && !replacementConfirmed) {
      setReplacementConfirmed(true);
      setMessage(`${occupiedSlot.recipeName} is already planned for ${dayNames[dayOfWeek]} ${mealType}. Confirm replacement to continue.`);
      return;
    }
    setMessage("");
    startSaving(async () => {
      const result = await addRecipeToMealPlanAction({
        recipeId,
        weekStart,
        dayOfWeek,
        mealType,
        servings,
        expectedRecipeId: occupiedSlot?.recipeId ?? null,
        replaceConfirmed: replacementConfirmed,
      });
      if (result.status !== "success" || !result.data) {
        setReplacementConfirmed(false);
        setMessage(result.message ?? "The meal could not be added.");
        const refreshed = await getAddToMealPlanContextAction(recipeId);
        if (refreshed.status === "success" && refreshed.data) setContext(refreshed.data);
        return;
      }
      const success = result.data;
      setOpen(false);
      setContext(null);
      router.refresh();
      toast.success(`Added to ${dayNames[success.dayOfWeek]} ${success.mealType}.`, {
        action: { label: "View meal plan", onClick: () => router.push(`/meal-plan?week=${success.weekStart}`) },
      });
    });
  }

  return <>
    <Button type="button" onClick={openPicker} className="w-full min-w-0 px-2 sm:px-4"><CalendarPlus className="hidden size-4 sm:block" />Add to meal plan</Button>
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-[1.75rem] bg-card p-5 shadow-2xl focus:outline-none sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[85dvh] sm:w-[min(38rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><Dialog.Title className="font-display text-2xl font-semibold">Add to meal plan</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Choose where {recipeName} belongs in your week.</Dialog.Description></div>
            <Dialog.Close asChild><Button variant="ghost" size="icon" className="size-9 min-h-9" aria-label="Close meal-plan picker"><X className="size-4" /></Button></Dialog.Close>
          </div>

          {loading ? <div className="grid min-h-64 place-items-center"><LoaderCircle className="size-7 animate-spin text-primary" aria-label="Loading meal plan" /></div> : null}
          {!loading && context ? <div className="mt-6 space-y-5">
            <fieldset><legend className="text-sm font-bold">Week</legend><div className="mt-2 grid grid-cols-2 gap-2">{context.weeks.map((week) => <button key={week.weekStart} type="button" aria-pressed={weekStart === week.weekStart} onClick={() => chooseWeek(week.weekStart)} className={cn("min-h-11 rounded-xl px-3 text-sm font-semibold ring-1 ring-border", weekStart === week.weekStart && "bg-primary text-primary-foreground ring-primary")}>{week.label}</button>)}</div></fieldset>
            <fieldset><legend className="text-sm font-bold">Day</legend><div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">{days.map((day) => { const disabled = selectedWeek?.label === "This week" && day < context.currentDayOfWeek; return <button key={day} type="button" disabled={disabled} aria-pressed={dayOfWeek === day} onClick={() => { setDayOfWeek(day); setReplacementConfirmed(false); setMessage(""); }} className={cn("min-h-12 rounded-xl px-1 text-xs font-semibold ring-1 ring-border disabled:opacity-35", dayOfWeek === day && "bg-primary text-primary-foreground ring-primary")}>{dayLabel(weekStart, day)}</button>; })}</div></fieldset>
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <fieldset><legend className="text-sm font-bold">Meal</legend><div className="mt-2 flex gap-2">{context.mealTypes.map((type) => <button key={type} type="button" aria-pressed={mealType === type} onClick={() => { setMealType(type); setReplacementConfirmed(false); setMessage(""); }} className={cn("min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold capitalize ring-1 ring-border", mealType === type && "bg-primary text-primary-foreground ring-primary")}>{type}</button>)}</div></fieldset>
              <label className="text-sm font-bold">Servings<input type="number" min="1" max="30" value={servings} onChange={(event) => setServings(Math.min(30, Math.max(1, Number(event.target.value))))} className="mt-2 h-11 w-full rounded-xl bg-background px-3 text-sm font-semibold ring-1 ring-input" /></label>
            </div>
            {occupiedSlot ? <div className="rounded-xl bg-orange-50 p-3 text-sm text-orange-950"><strong>{sentenceLabel(dayNames[dayOfWeek])} {mealType} already has {occupiedSlot.recipeName}.</strong><p className="mt-1">Adding this recipe will replace that meal.</p></div> : <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-900"><Check className="size-4" />This slot is open.</div>}
            {message ? <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{message}</p> : null}
            <div className="grid grid-cols-2 gap-3"><Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close><Button type="button" disabled={saving} onClick={submit}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : null}{occupiedSlot && replacementConfirmed ? "Replace meal" : occupiedSlot ? "Review replacement" : "Add meal"}</Button></div>
          </div> : null}
          {!loading && !context && message ? <p role="alert" className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">{message}</p> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
