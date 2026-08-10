import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, PlayCircle } from "lucide-react";

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
  const [{ identity, profile }, query, catalogue] = await Promise.all([
    requireCompletedProfile(),
    searchParams,
    getRecipeCatalogue(),
  ]);
  const activeSessions = await getActiveCookSessions(identity.sub);
  const activeRecipeIds = new Set(activeSessions.map((session) => session.recipe_id));
  const starterRecipes = catalogue.filter((recipe) => !activeRecipeIds.has(recipe.id)).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-7">
      <PageIntro
        eyebrow="Cook with confidence"
        title="One clear step. Then the next."
        description="Scale servings, keep the screen awake, and return exactly where you stopped."
      />

      {query.completed === "1" ? (
        <Card role="status" className="flex items-start gap-3 border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div><p className="font-bold">Meal complete.</p><p className="mt-0.5 text-muted-foreground">BiteWise saved this cooked meal for future variety and personalisation.</p></div>
        </Card>
      ) : null}

      <section aria-labelledby="resume-cooking" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your kitchen now</p>
          <h2 id="resume-cooking" className="mt-1 font-display text-3xl font-semibold">{activeSessions.length ? "Resume cooking" : "Nothing waiting on the stove"}</h2>
        </div>
        {activeSessions.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {activeSessions.map((session) => (
              <Card key={session.id} className="grid overflow-hidden sm:grid-cols-[11rem_minmax(0,1fr)]">
                <div className="relative min-h-44 bg-secondary">
                  {session.recipe.image ? <Image src={session.recipe.image.path} alt={session.recipe.image.alt} fill sizes="(max-width: 639px) 100vw, 11rem" className="object-cover" /> : null}
                </div>
                <div className="flex flex-col p-5">
                  <Badge className="w-fit bg-accent/20 text-accent-foreground"><PlayCircle className="mr-1 size-4" aria-hidden="true" />Step {session.current_step} of {session.recipe.instructions.length}</Badge>
                  <h3 className="mt-3 font-display text-2xl font-semibold">{session.recipe.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{session.servings} servings · progress saved</p>
                  <Button asChild className="mt-auto pt-3"><Link href={`/cook/${session.recipe_id}`}>Resume session<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 sm:p-8"><p className="max-w-2xl text-sm leading-6 text-muted-foreground">Start a recipe below. BiteWise will save each completed step so an interruption never means starting over.</p></Card>
        )}
      </section>

      <section aria-labelledby="start-recipe" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Choose what to make</p><h2 id="start-recipe" className="mt-1 font-display text-3xl font-semibold">Start a guided session</h2></div>
          <Button asChild variant="ghost"><Link href="/discover">Browse all recipes<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {starterRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden">
              <div className="relative aspect-[16/9] bg-secondary">
                {recipe.image ? <Image src={recipe.image.path} alt={recipe.image.alt} fill sizes="(max-width: 639px) 92vw, (max-width: 1279px) 46vw, 30vw" className="object-cover" /> : null}
              </div>
              <div className="space-y-4 p-5">
                <div><p className="flex items-center gap-1.5 text-xs font-bold text-primary"><Clock3 className="size-4" aria-hidden="true" />{recipe.totalMinutes} minutes</p><h3 className="mt-1 font-display text-2xl font-semibold">{recipe.name}</h3></div>
                <StartSessionForm recipeId={recipe.id} defaultServings={profile.household_size} compact />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
