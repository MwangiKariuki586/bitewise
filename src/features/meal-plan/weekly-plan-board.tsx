"use client";

import { useActionState, useState } from "react";
import {
  CalendarRange,
  ChefHat,
  Clock3,
  Coins,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  generateWeeklyPlanAction,
  mutateWeeklyPlanAction,
} from "@/features/meal-plan/actions";
import type {
  WeeklyPlan,
  WeeklyPlanItem,
} from "@/features/meal-plan/data";
import type {
  CandidatesByMealType,
  PlanCandidate,
} from "@/features/meal-plan/generator";
import { weekDayDate } from "@/features/meal-plan/dates";
import { mealTypes, type MealType } from "@/features/meal-plan/schemas";
import { GenerateShoppingList } from "@/features/shopping-list/generate-shopping-list";
import type { ActionResult } from "@/lib/action-result";

interface WeeklyPlanBoardProps {
  weekStart: string;
  budgetLimitMinor: number;
  householdSize: number;
  plan: WeeklyPlan | null;
  candidates: CandidatesByMealType;
}

const initialState: ActionResult = { status: "idle" };

function formatKes(minor: number) {
  return `KES ${Math.ceil(minor / 100).toLocaleString("en-KE")}`;
}

function mealLabel(mealType: MealType) {
  return mealType[0].toUpperCase() + mealType.slice(1);
}

function MutationNotice({ state }: { state: ActionResult }) {
  if (state.status === "idle") return null;
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={
        state.status === "error"
          ? "rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
          : "rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
      }
    >
      {state.message}
    </p>
  );
}

function HiddenSlotFields({
  weekStart,
  dayOfWeek,
  mealType,
}: {
  weekStart: string;
  dayOfWeek: number;
  mealType: MealType;
}) {
  return (
    <>
      <input type="hidden" name="weekStart" value={weekStart} />
      <input type="hidden" name="dayOfWeek" value={dayOfWeek} />
      <input type="hidden" name="mealType" value={mealType} />
    </>
  );
}

function PlannedSlot({
  weekStart,
  item,
}: {
  weekStart: string;
  item: WeeklyPlanItem;
}) {
  const [state, action, pending] = useActionState(
    mutateWeeklyPlanAction,
    initialState,
  );
  return (
    <div className="space-y-2.5 rounded-xl bg-secondary/50 p-3 ring-1 ring-border/45">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {mealLabel(item.mealType)}
          </p>
          <h3 className="mt-0.5 truncate font-display text-lg font-semibold">
            {item.recipe.name}
          </h3>
        </div>
        <Badge>{formatKes(item.budgetedCostMinor)}</Badge>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5 text-primary" aria-hidden="true" />
          {item.recipe.totalMinutes} min
        </span>
        <span className="inline-flex items-center gap-1.5 capitalize">
          <ChefHat className="size-3.5 text-primary" aria-hidden="true" />
          {item.recipe.difficulty}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UsersRound className="size-3.5 text-primary" aria-hidden="true" />
          {item.servings} serving{item.servings === 1 ? "" : "s"}
        </span>
      </div>

      <form action={action} className="flex items-end gap-2">
        <HiddenSlotFields
          weekStart={weekStart}
          dayOfWeek={item.dayOfWeek}
          mealType={item.mealType}
        />
        <input type="hidden" name="operation" value="set_servings" />
        <label className="min-w-0 flex-1 text-xs font-semibold">
          Servings
          <Input
            key={item.servings}
            className="mt-1 h-10"
            name="servings"
            type="number"
            min="1"
            max="30"
            defaultValue={item.servings}
            inputMode="numeric"
            aria-label={`${mealLabel(item.mealType)} servings`}
          />
        </label>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          Update
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-2">
        <form action={action}>
          <HiddenSlotFields
            weekStart={weekStart}
            dayOfWeek={item.dayOfWeek}
            mealType={item.mealType}
          />
          <input type="hidden" name="operation" value="swap" />
          <Button className="w-full" type="submit" variant="outline" disabled={pending}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Swap
          </Button>
        </form>
        <form action={action}>
          <HiddenSlotFields
            weekStart={weekStart}
            dayOfWeek={item.dayOfWeek}
            mealType={item.mealType}
          />
          <input type="hidden" name="operation" value="remove" />
          <Button className="w-full" type="submit" variant="ghost" disabled={pending}>
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </Button>
        </form>
      </div>
      <MutationNotice state={state} />
    </div>
  );
}

function EmptySlot({
  weekStart,
  dayOfWeek,
  mealType,
  householdSize,
  candidates,
}: {
  weekStart: string;
  dayOfWeek: number;
  mealType: MealType;
  householdSize: number;
  candidates: PlanCandidate[];
}) {
  const [state, action, pending] = useActionState(
    mutateWeeklyPlanAction,
    initialState,
  );
  return (
    <div className="rounded-xl bg-background/75 p-3 ring-1 ring-border/70">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {mealLabel(mealType)}
          </p>
          <p className="mt-0.5 text-sm font-semibold">Open meal slot</p>
          <p className="mt-0.5 line-clamp-1 text-[0.68rem] text-muted-foreground">
            No meal selected yet.
          </p>
        </div>
        {candidates.length ? (
          <form action={action} className="shrink-0">
            <HiddenSlotFields
              weekStart={weekStart}
              dayOfWeek={dayOfWeek}
              mealType={mealType}
            />
            <input type="hidden" name="operation" value="select" />
            <input type="hidden" name="servings" value={householdSize} />
            <input type="hidden" name="recipeId" value={candidates[0].recipeId} />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : null}
              Add meal
            </Button>
          </form>
        ) : null}
      </div>
      {candidates.length ? (
        <details className="group mt-2 border-t border-border/55 pt-2">
          <summary className="cursor-pointer list-none text-[0.68rem] font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Choose another meal
          </summary>
          <form action={action} className="mt-2 space-y-2">
            <HiddenSlotFields
              weekStart={weekStart}
              dayOfWeek={dayOfWeek}
              mealType={mealType}
            />
            <input type="hidden" name="operation" value="select" />
            <input type="hidden" name="servings" value={householdSize} />
            <select
              name="recipeId"
              className="h-10 w-full rounded-xl bg-background px-3 text-xs outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={candidates[0].recipeId}
              aria-label={`${mealLabel(mealType)} meal`}
            >
              {candidates.map((candidate) => (
                <option key={candidate.recipeId} value={candidate.recipeId}>
                  {candidate.name} · {formatKes(candidate.budgetedCostMinor)}
                </option>
              ))}
            </select>
            <Button className="w-full" type="submit" variant="secondary" size="sm" disabled={pending}>
              Use selected meal
            </Button>
          </form>
        </details>
      ) : (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          No recipe currently fits this slot and your saved hard constraints.
        </p>
      )}
      <MutationNotice state={state} />
    </div>
  );
}

function GeneratePlan({ weekStart }: { weekStart: string }) {
  const [state, action, pending] = useActionState(
    generateWeeklyPlanAction,
    initialState,
  );
  return (
    <div className="space-y-2">
      <form action={action}>
        <input type="hidden" name="weekStart" value={weekStart} />
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {pending ? "Building your week…" : "Generate complete week"}
        </Button>
      </form>
      <MutationNotice state={state} />
      <p className="text-center text-xs text-muted-foreground">
        Up to 10 complete generations every 10 minutes.
      </p>
    </div>
  );
}

function dayMeta(weekStart: string, dayOfWeek: number) {
  const date = weekDayDate(weekStart, dayOfWeek);
  return {
    dayName: new Intl.DateTimeFormat("en-KE", {
      weekday: "long",
      timeZone: "UTC",
    }).format(date),
    shortDayName: new Intl.DateTimeFormat("en-KE", {
      weekday: "short",
      timeZone: "UTC",
    }).format(date),
    dateLabel: new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(date),
    dayNumber: new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      timeZone: "UTC",
    }).format(date),
  };
}

function DayPlanCard({
  weekStart,
  dayOfWeek,
  plan,
  householdSize,
  candidates,
}: {
  weekStart: string;
  dayOfWeek: number;
  plan: WeeklyPlan | null;
  householdSize: number;
  candidates: CandidatesByMealType;
}) {
  const { dayName, dateLabel } = dayMeta(weekStart, dayOfWeek);
  const dayItems = plan?.items.filter((item) => item.dayOfWeek === dayOfWeek) ?? [];

  return (
    <Card className="p-3.5 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 aria-label={dayName} className="font-display text-xl font-semibold">
          {dayName} <span className="font-sans text-xs font-bold text-primary">· {dateLabel}</span>
        </h2>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Coins className="size-3.5 text-primary" aria-hidden="true" />
          {formatKes(dayItems.reduce((total, item) => total + item.budgetedCostMinor, 0))}
        </span>
      </header>
      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        {mealTypes.map((mealType) => {
          const item = dayItems.find((candidate) => candidate.mealType === mealType);
          return item ? (
            <PlannedSlot key={`${dayOfWeek}-${mealType}`} weekStart={weekStart} item={item} />
          ) : (
            <EmptySlot
              key={`${dayOfWeek}-${mealType}-empty`}
              weekStart={weekStart}
              dayOfWeek={dayOfWeek}
              mealType={mealType}
              householdSize={householdSize}
              candidates={candidates[mealType]}
            />
          );
        })}
      </div>
    </Card>
  );
}

export function WeeklyPlanBoard({
  weekStart,
  budgetLimitMinor,
  householdSize,
  plan,
  candidates,
}: WeeklyPlanBoardProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showWholeWeek, setShowWholeWeek] = useState(false);
  const totalMinor = plan?.estimatedTotalMinor ?? 0;
  const percentage = Math.min(100, Math.round((totalMinor / budgetLimitMinor) * 100));
  const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    ...dayMeta(weekStart, dayOfWeek),
  }));

  return (
    <div className="space-y-5 sm:space-y-6">
      <div
        role="group"
        aria-label="Choose a day"
        className="flex overflow-x-auto rounded-2xl bg-card p-1 shadow-sm ring-1 ring-border/65 lg:hidden"
      >
        {days.map((day) => (
          <button
            key={day.dayOfWeek}
            type="button"
            aria-label={`${day.shortDayName} ${day.dayNumber}`}
            aria-pressed={!showWholeWeek && selectedDay === day.dayOfWeek}
            onClick={() => {
              setSelectedDay(day.dayOfWeek);
              setShowWholeWeek(false);
            }}
            className={`min-h-12 min-w-[3.75rem] flex-1 rounded-xl px-1.5 text-center text-[0.65rem] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              !showWholeWeek && selectedDay === day.dayOfWeek
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary/55"
            }`}
          >
            <span className="block uppercase tracking-wide">{day.shortDayName}</span>
            <span className="mt-0.5 block text-[0.6rem] font-medium leading-none">{day.dateLabel}</span>
          </button>
        ))}
      </div>

      <Card className="overflow-hidden p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{plan?.items.length ?? 0} of 21 meals</Badge>
              <Badge className="bg-accent/20 text-accent-foreground">
                {percentage}% of budget
              </Badge>
            </div>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Estimated week
                </p>
                <p className="mt-0.5 font-display text-2xl font-semibold">
                  {formatKes(totalMinor)}
                </p>
              </div>
              <p className="text-right text-sm font-semibold text-muted-foreground">
                of {formatKes(budgetLimitMinor)}
              </p>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label="Weekly budget used"
              aria-valuemin={0}
              aria-valuemax={budgetLimitMinor}
              aria-valuenow={totalMinor}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            <GeneratePlan weekStart={weekStart} />
            {plan ? <GenerateShoppingList mealPlanId={plan.id} /> : null}
          </div>
        </div>
      </Card>

      <section aria-label="Mobile meal plan" className="space-y-3 lg:hidden">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-center"
          aria-pressed={showWholeWeek}
          onClick={() => setShowWholeWeek((current) => !current)}
        >
          <CalendarRange className="size-4" aria-hidden="true" />
          {showWholeWeek ? "Back to selected day" : "View whole week"}
        </Button>

        {showWholeWeek ? (
          <Card className="divide-y divide-border/60 overflow-hidden px-4">
            {days.map((day) => {
              const dayItems = plan?.items.filter((item) => item.dayOfWeek === day.dayOfWeek) ?? [];
              return (
                <button
                  key={day.dayOfWeek}
                  type="button"
                  aria-label={`Edit ${day.dayName} ${day.dateLabel}`}
                  onClick={() => {
                    setSelectedDay(day.dayOfWeek);
                    setShowWholeWeek(false);
                  }}
                  className="grid min-h-20 w-full grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-primary">{day.shortDayName}</span>
                    <span className="block text-xs text-muted-foreground">{day.dateLabel}</span>
                  </span>
                  <span className="min-w-0 space-y-1">
                    {mealTypes.map((mealType) => (
                      <span key={mealType} className="block truncate text-xs">
                        <span className="font-semibold capitalize">{mealType}:</span>{" "}
                        {dayItems.find((item) => item.mealType === mealType)?.recipe.name ?? "Open"}
                      </span>
                    ))}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatKes(dayItems.reduce((sum, item) => sum + item.budgetedCostMinor, 0))}
                  </span>
                </button>
              );
            })}
          </Card>
        ) : (
          <div id="selected-day-plan">
            <DayPlanCard
              weekStart={weekStart}
              dayOfWeek={selectedDay}
              plan={plan}
              householdSize={householdSize}
              candidates={candidates}
            />
          </div>
        )}
      </section>

      <section aria-label="Seven-day meal plan" className="hidden gap-4 lg:grid xl:grid-cols-2">
        {days.map((day) => (
          <DayPlanCard
            key={day.dayOfWeek}
            weekStart={weekStart}
            dayOfWeek={day.dayOfWeek}
            plan={plan}
            householdSize={householdSize}
            candidates={candidates}
          />
        ))}
      </section>
    </div>
  );
}
