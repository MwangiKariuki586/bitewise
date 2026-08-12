import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Clock3, Coins, LockKeyhole, UsersRound } from "lucide-react";

import { AppShell } from "@/components/navigation/app-shell";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDiscoverKes, formatDiscoverLabel } from "@/features/discover/search-card";
import {
  emptyRecipePersonalisation,
  getRecipePersonalisation,
} from "@/features/personalisation/data";
import { RecipePersonalisationControls } from "@/features/personalisation/controls";
import { getPublicRecipeBySlug } from "@/features/recipes/data";
import { WatchCookPanel } from "@/features/watch-cook/watch-cook-panel";
import { getSessionIdentity } from "@/lib/auth/session";

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(value);
}

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getPublicRecipeBySlug(slug);
  return recipe
    ? { title: recipe.name, description: recipe.summary }
    : { title: "Recipe not found" };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;
  const [recipe, identity] = await Promise.all([
    getPublicRecipeBySlug(slug),
    getSessionIdentity(),
  ]);
  if (!recipe) notFound();
  const personalisation = identity
    ? (await getRecipePersonalisation(identity.sub, [recipe.id])).get(recipe.id) ??
      emptyRecipePersonalisation
    : emptyRecipePersonalisation;

  return (
    <AppShell
      accountMenu={
        <Suspense fallback={<span className="size-10 animate-pulse rounded-full bg-muted" aria-label="Loading account menu" />}>
          <ProfileMenu />
        </Suspense>
      }
    >
      <article className="mx-auto max-w-7xl space-y-7">
        <Button asChild variant="ghost" className="-ml-2"><Link href="/discover"><ArrowLeft className="size-4" aria-hidden="true" />Back to Discover</Link></Button>

        <header className="grid overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-[0_24px_65px_-36px_rgba(17,55,39,0.9)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-5 py-8 sm:px-9 sm:py-11">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">{formatDiscoverLabel(recipe.cuisine)} · {formatDiscoverLabel(recipe.difficulty)}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-6xl">{recipe.name}</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/78">{recipe.summary}</p>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <span className="flex flex-col gap-1 text-xs font-semibold"><Clock3 className="size-5" aria-hidden="true" />{recipe.totalMinutes} min</span>
              <span className="flex flex-col gap-1 text-xs font-semibold"><UsersRound className="size-5" aria-hidden="true" />{recipe.baseServings} servings</span>
              <span className="flex flex-col gap-1 text-xs font-semibold"><Coins className="size-5" aria-hidden="true" />{formatDiscoverKes(recipe.estimatedCostPerServingMinor)} each</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {recipe.mealTypes.map((type) => <Badge key={type} className="bg-white/12 text-primary-foreground ring-1 ring-white/15">{formatDiscoverLabel(type)}</Badge>)}
              {recipe.dietaryTags.map((tag) => <Badge key={tag} className="bg-accent text-accent-foreground">{formatDiscoverLabel(tag)}</Badge>)}
            </div>
            <div className="mt-6 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 [&_p]:text-primary-foreground/75">
              <RecipePersonalisationControls
                recipeId={recipe.id}
                initialState={personalisation}
                authenticated={Boolean(identity)}
              />
            </div>
          </div>
          <div className="relative min-h-72 bg-secondary lg:min-h-[32rem]">
            {recipe.image ? <Image src={recipe.image.path} alt={recipe.image.alt} fill priority sizes="(max-width: 1023px) 100vw, 48vw" className="object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Image unavailable</div>}
          </div>
        </header>

        <section aria-label="Recipe cost" className="grid gap-3 sm:grid-cols-3">
          <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Estimated total</p><p className="mt-2 font-display text-3xl font-semibold">{formatDiscoverKes(recipe.estimatedCostMinor)}</p></Card>
          <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Per serving</p><p className="mt-2 font-display text-3xl font-semibold">{formatDiscoverKes(recipe.estimatedCostPerServingMinor)}</p></Card>
          <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Price basis</p><p className="mt-2 font-semibold">Indicative {recipe.costLocation} prices</p><p className="mt-1 text-xs text-muted-foreground">Updated {recipe.costCapturedOn ?? "date unavailable"}</p></Card>
        </section>

        <WatchCookPanel
          recipeName={recipe.name}
          recipeMinutes={recipe.totalMinutes}
          recipeSkill={recipe.difficulty as "easy" | "moderate"}
          suggestedEquipment={[
            ...recipe.acceptedHeatSources,
            ...recipe.requiredEquipment,
          ]}
          dietaryTags={recipe.dietaryTags}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <aside aria-label="Recipe ingredients" className="rounded-[1.5rem] bg-card p-5 shadow-sm ring-1 ring-border/55 lg:sticky lg:top-24 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">What you need</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Ingredients</h2>
            <ul className="mt-5 divide-y divide-border/55">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <span><span className="font-semibold">{ingredient.name}</span>{ingredient.preparation ? <span className="block text-xs text-muted-foreground">{ingredient.preparation}</span> : null}</span>
                  <span className="shrink-0 font-bold text-primary">{formatQuantity(ingredient.quantity)} {ingredient.unit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-secondary/65 p-4">
              <p className="flex items-center gap-2 text-sm font-bold"><LockKeyhole className="size-4 text-primary" aria-hidden="true" />Personal planning</p>
              <p className="mt-1 text-xs leading-5 text-foreground/80">Sign in to place recipes into your private weekly plan.</p>
              <div className="mt-4 grid gap-2">
                <Button asChild className="w-full"><Link href={`/cook/${recipe.id}`}>Start Cook Mode</Link></Button>
                <Button asChild variant="outline" className="w-full"><Link href="/meal-plan">Open Meal Plan</Link></Button>
              </div>
            </div>
          </aside>

          <section aria-labelledby="recipe-method" className="rounded-[1.5rem] bg-card p-5 shadow-sm ring-1 ring-border/55 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Written method</p>
            <h2 id="recipe-method" className="mt-2 font-display text-3xl font-semibold">Cook it with confidence</h2>
            <ol className="mt-6 space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={`${index}-${instruction}`} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 rounded-2xl bg-secondary/45 p-4 sm:p-5">
                  <span className="grid size-11 place-items-center rounded-full bg-primary font-display text-xl font-semibold text-primary-foreground">{index + 1}</span>
                  <p className="pt-2 text-sm leading-7">{instruction}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {recipe.image ? (
          <footer className="text-xs leading-5 text-muted-foreground">
            Photo by <a className="font-semibold underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={recipe.image.attributionUrl} target="_blank" rel="noreferrer">{recipe.image.attributionName}</a> · <a className="font-semibold underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={recipe.image.licenseUrl} target="_blank" rel="noreferrer">{recipe.image.licenseName}</a>.
          </footer>
        ) : null}
      </article>
    </AppShell>
  );
}
