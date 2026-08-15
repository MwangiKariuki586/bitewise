import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChefHat,
  ChevronRight,
  CheckCircle2,
  Clock3,
  PlayCircle,
} from "lucide-react";

import { PageIntro } from "@/components/product/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveCookSessions } from "@/features/cook/data";
import { StartSessionForm } from "@/features/cook/start-session-form";
import { requireCompletedProfile } from "@/features/profile/data";
import { getRecipeCatalogue } from "@/features/recipes/data";

interface CookPageProps {
  searchParams: Promise<{ completed?: string }>;
}

export default async function CookPage({ searchParams }: CookPageProps) {
  const query = await searchParams;
  const returnParams = new URLSearchParams();
  if (query.completed) returnParams.set("completed", query.completed);
  const returnTo = `/cook${returnParams.size ? `?${returnParams}` : ""}`;
  const [{ identity, profile }, catalogue] = await Promise.all([
    requireCompletedProfile(returnTo),
    getRecipeCatalogue(),
  ]);
  const activeSessions = await getActiveCookSessions(identity.sub);
  const activeRecipeIds = new Set(
    activeSessions.map((session) => session.recipe_id),
  );
  const starterRecipes = catalogue
    .filter((recipe) => !activeRecipeIds.has(recipe.id))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-7">
      <PageIntro
        eyebrow="Cook"
        title="One clear step. Then the next."
        description="Scale servings, keep the screen awake, and return exactly where you stopped."
        variant="standard"
      />

      <Link
        href={
          activeSessions[0]
            ? `/cook/${activeSessions[0].recipe_id}`
            : "#start-recipe"
        }
        className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-card px-4 text-sm font-semibold shadow-sm ring-1 ring-border/65 outline-none transition-colors hover:bg-secondary/45 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2.5">
          <ChefHat className="size-4 text-primary" aria-hidden="true" />
          Guided kitchen mode
        </span>
        <ChevronRight className="size-4 text-primary" aria-hidden="true" />
      </Link>

      {query.completed === "1" ? (
        <Card
          role="status"
          className="flex items-start gap-3 border-primary/20 bg-primary/5 p-4 text-sm text-primary"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Meal complete.</p>
            <p className="mt-0.5 text-muted-foreground">
              BiteWise saved this cooked meal for future variety and
              personalisation.
            </p>
          </div>
        </Card>
      ) : null}

      <section aria-labelledby="resume-cooking" className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Your kitchen now
          </p>
          <h2
            id="resume-cooking"
            className="font-display text-2xl font-semibold"
          >
            {activeSessions.length
              ? "Resume cooking"
              : "Nothing on the stove yet"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
            {activeSessions.length
              ? "Your place is saved. Pick up with the next step."
              : "Start a recipe and BiteWise will guide you step by step. You can pause anytime."}
          </p>
        </div>

        {activeSessions.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {activeSessions.map((session) => (
              <Card
                key={session.id}
                className="grid min-h-36 grid-cols-[7.25rem_minmax(0,1fr)] overflow-hidden sm:grid-cols-[9rem_minmax(0,1fr)]"
              >
                <div className="relative min-h-full bg-secondary">
                  {session.recipe.image ? (
                    <Image
                      src={session.recipe.image.path}
                      alt={session.recipe.image.alt}
                      fill
                      sizes="(max-width: 639px) 116px, 144px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col p-4">
                  <Badge className="w-fit bg-accent/20 text-accent-foreground">
                    <PlayCircle className="mr-1 size-4" aria-hidden="true" />
                    Step {session.current_step} of{" "}
                    {session.recipe.instructions.length}
                  </Badge>
                  <h3 className="mt-2 truncate font-display text-xl font-semibold">
                    {session.recipe.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.servings} servings · progress saved
                  </p>
                  <Button asChild size="sm" className="mt-2 w-full sm:w-fit">
                    <Link href={`/cook/${session.recipe_id}`}>
                      Resume session
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="start-recipe" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Choose what to make
            </p>
            <h2
              id="start-recipe"
              className="mt-1 font-display text-xl font-semibold"
            >
              Popular picks for you
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/discover">
              View all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {starterRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="grid min-h-[7.5rem] grid-cols-[7rem_minmax(0,1fr)] overflow-hidden sm:grid-cols-[8rem_minmax(0,1fr)]"
            >
              <div className="relative min-h-full bg-secondary">
                {recipe.image ? (
                  <Image
                    src={recipe.image.path}
                    alt={recipe.image.alt}
                    fill
                    sizes="(max-width: 639px) 112px, 128px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col p-3 sm:p-3.5">
                <h3 className="line-clamp-2 font-display text-base font-semibold leading-tight sm:text-lg">
                  {recipe.name}
                </h3>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[0.68rem] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock3
                      className="size-3.5 text-primary"
                      aria-hidden="true"
                    />
                    {recipe.totalMinutes} min
                  </span>
                </div>
                <div className="mt-auto pt-2">
                  <StartSessionForm
                    recipeId={recipe.id}
                    defaultServings={profile.household_size}
                    compact
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
