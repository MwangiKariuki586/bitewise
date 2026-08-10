import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  formatWeekRange,
  currentWeekStart,
  shiftWeek,
} from "@/features/meal-plan/dates";
import {
  getPlanCandidates,
  getWeeklyPlan,
  weeklyBudgetMinor,
} from "@/features/meal-plan/data";
import { weekStartSchema } from "@/features/meal-plan/schemas";
import { WeeklyPlanBoard } from "@/features/meal-plan/weekly-plan-board";
import { requireCompletedProfile } from "@/features/profile/data";
import { cn } from "@/lib/utils";

interface MealPlanPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function MealPlanPage({ searchParams }: MealPlanPageProps) {
  const [{ identity, profile }, params] = await Promise.all([
    requireCompletedProfile(),
    searchParams,
  ]);
  const requestedWeek = weekStartSchema.safeParse(params.week);
  const weekStart = requestedWeek.success ? requestedWeek.data : currentWeekStart();
  const [plan, candidates] = await Promise.all([
    getWeeklyPlan(identity.sub, weekStart),
    getPlanCandidates(identity.sub, profile),
  ]);
  const previousWeek = shiftWeek(weekStart, -1);
  const nextWeek = shiftWeek(weekStart, 1);

  return (
    <div className="space-y-7 pb-8">
      <section className="overflow-hidden rounded-[2rem] bg-primary px-5 py-7 text-primary-foreground shadow-[0_24px_65px_-36px_rgba(17,55,39,0.9)] sm:px-8 sm:py-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">
          Meal Plan
        </p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Make the week feel lighter.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-primary-foreground/78 sm:text-base">
              Build seven practical days around your real budget, kitchen, time, and household.
              Swap one meal without losing the shape of the week.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/75">
              Planning week
            </p>
            <p className="mt-1 font-display text-xl font-semibold">{formatWeekRange(weekStart)}</p>
          </div>
        </div>
      </section>

      <nav aria-label="Choose planning week" className="flex items-center justify-between gap-3">
        <Link
          href={`/meal-plan?week=${previousWeek}`}
          className={cn(buttonVariants({ variant: "outline" }), "px-3 sm:px-4")}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous week</span>
          <span className="sm:hidden">Previous</span>
        </Link>
        <Link
          href="/meal-plan"
          className={buttonVariants({ variant: "ghost" })}
          aria-current={weekStart === currentWeekStart() ? "date" : undefined}
        >
          This week
        </Link>
        <Link
          href={`/meal-plan?week=${nextWeek}`}
          className={cn(buttonVariants({ variant: "outline" }), "px-3 sm:px-4")}
        >
          <span className="hidden sm:inline">Next week</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </nav>

      <WeeklyPlanBoard
        weekStart={weekStart}
        budgetLimitMinor={weeklyBudgetMinor(profile)}
        householdSize={profile.household_size}
        plan={plan}
        candidates={candidates}
      />
    </div>
  );
}
