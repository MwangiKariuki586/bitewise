import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PageIntro } from "@/components/product/page-intro";
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
  const params = await searchParams;
  const returnParams = new URLSearchParams();
  if (params.week) returnParams.set("week", params.week);
  const returnTo = `/meal-plan${returnParams.size ? `?${returnParams}` : ""}`;
  const { identity, profile } = await requireCompletedProfile(returnTo);
  const requestedWeek = weekStartSchema.safeParse(params.week);
  const weekStart = requestedWeek.success ? requestedWeek.data : currentWeekStart();
  const [plan, candidates] = await Promise.all([
    getWeeklyPlan(identity.sub, weekStart),
    getPlanCandidates(identity.sub, profile),
  ]);
  const previousWeek = shiftWeek(weekStart, -1);
  const nextWeek = shiftWeek(weekStart, 1);
  const isCurrentWeek = weekStart === currentWeekStart();

  return (
    <div className="space-y-4 pb-8 sm:space-y-5">
      <PageIntro
        eyebrow="Meal Plan"
        title="Make the week feel lighter."
        description="Balanced meals, smarter budget, less stress."
        variant="standard"
      />

      <nav aria-label="Choose planning week" className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-3">
        <Link
          href={`/meal-plan?week=${previousWeek}`}
          aria-label="Previous week"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-9 min-h-9 sm:h-11 sm:w-auto sm:px-4")}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous week</span>
        </Link>
        <Link
          href="/meal-plan"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "min-w-0 flex-col gap-0 px-2 text-center",
          )}
          aria-current={isCurrentWeek ? "date" : undefined}
          aria-label={isCurrentWeek ? "This week" : "Return to this week"}
        >
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {isCurrentWeek ? "This week" : "Return to this week"}
          </span>
          <span className="max-w-full truncate font-display text-sm font-semibold sm:text-base">
            {formatWeekRange(weekStart)}
          </span>
        </Link>
        <Link
          href={`/meal-plan?week=${nextWeek}`}
          aria-label="Next week"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-9 min-h-9 sm:h-11 sm:w-auto sm:px-4")}
        >
          <span className="hidden sm:inline">Next week</span>
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
