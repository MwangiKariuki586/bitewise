"use client";

import { useActionState } from "react";
import {
  CalendarDays,
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
    <div className="space-y-3 rounded-2xl bg-secondary/55 p-4 ring-1 ring-border/45">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            {mealLabel(item.mealType)}
          </p>
          <h3 className="mt-1 truncate font-display text-xl font-semibold">
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
            className="mt-1 h-11"
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
    <div className="space-y-3 rounded-2xl bg-background/75 p-4 ring-1 ring-dashed ring-border">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {mealLabel(mealType)}
        </p>
        <p className="mt-1 text-sm font-semibold">Open meal slot</p>
      </div>
      {candidates.length ? (
        <form action={action} className="space-y-3">
          <HiddenSlotFields
            weekStart={weekStart}
            dayOfWeek={dayOfWeek}
            mealType={mealType}
          />
          <input type="hidden" name="operation" value="select" />
          <input type="hidden" name="servings" value={householdSize} />
          <label className="block text-xs font-semibold">
            Choose a meal
            <select
              name="recipeId"
              className="mt-1 h-12 w-full rounded-xl bg-background px-3 text-sm outline-none ring-1 ring-input focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={candidates[0].recipeId}
              aria-label={`${mealLabel(mealType)} meal`}
            >
              {candidates.map((candidate) => (
                <option key={candidate.recipeId} value={candidate.recipeId}>
                  {candidate.name} · {formatKes(candidate.budgetedCostMinor)}
                </option>
              ))}
            </select>
          </label>
          <Button className="w-full" type="submit" variant="secondary" disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
            Add meal
          </Button>
        </form>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
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
    <div className="space-y-3">
      <form action={action}>
        <input type="hidden" name="weekStart" value={weekStart} />
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
          {pending ? "Building your week…" : "Generate complete week"}
        </Button>
      </form>
      <MutationNotice state={state} />
      <p className="text-xs text-muted-foreground">
        Up to 10 complete generations every 10 minutes. Individual edits stay available.
      </p>
    </div>
  );
}

export function WeeklyPlanBoard({
  weekStart,
  budgetLimitMinor,
  householdSize,
  plan,
  candidates,
}: WeeklyPlanBoardProps) {
  const totalMinor = plan?.estimatedTotalMinor ?? 0;
  const percentage = Math.min(100, Math.round((totalMinor / budgetLimitMinor) * 100));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{plan?.items.length ?? 0} of 21 meals</Badge>
              <Badge className="bg-accent/20 text-accent-foreground">
                {percentage}% of budget
              </Badge>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Estimated week
                </p>
                <p className="mt-1 font-display text-3xl font-semibold">
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

      {!plan ? (
        <div className="rounded-2xl bg-accent/10 px-5 py-4 text-sm leading-6 text-accent-foreground">
          Generate all 21 meals at once, or build the week manually from any open slot.
          Every save is re-priced and checked against your current profile.
        </div>
      ) : null}

      <section aria-label="Seven-day meal plan" className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 7 }, (_, dayOfWeek) => {
          const date = weekDayDate(weekStart, dayOfWeek);
          const dayName = new Intl.DateTimeFormat("en-KE", {
            weekday: "long",
            timeZone: "UTC",
          }).format(date);
          const dateLabel = new Intl.DateTimeFormat("en-KE", {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          }).format(date);
          return (
            <Card key={dayOfWeek} className="p-4 sm:p-5">
              <header className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <CalendarDays className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl font-semibold">{dayName}</h2>
                    <p className="text-xs font-semibold text-muted-foreground">{dateLabel}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Coins className="size-3.5 text-primary" aria-hidden="true" />
                  {formatKes(
                    plan?.items
                      .filter((item) => item.dayOfWeek === dayOfWeek)
                      .reduce((total, item) => total + item.budgetedCostMinor, 0) ?? 0,
                  )}
                </span>
              </header>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {mealTypes.map((mealType) => {
                  const item = plan?.items.find(
                    (candidate) =>
                      candidate.dayOfWeek === dayOfWeek && candidate.mealType === mealType,
                  );
                  return item ? (
                    <PlannedSlot
                      key={`${dayOfWeek}-${mealType}`}
                      weekStart={weekStart}
                      item={item}
                    />
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
        })}
      </section>
    </div>
  );
}
