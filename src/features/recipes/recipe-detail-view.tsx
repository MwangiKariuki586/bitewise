"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, Check, ChevronDown, CircleDollarSign, Clock3, ExternalLink,
  Gauge, Minus, PlayCircle, Plus, ShieldCheck, ShoppingCart,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CookSetupControl } from "@/features/cook/cook-setup-control";
import { AddToMealPlanControl } from "@/features/meal-plan/add-to-meal-plan-control";
import { RecipePersonalisationControls } from "@/features/personalisation/controls";
import type { RecipePersonalisationState } from "@/features/personalisation/data";
import type { RecipeCatalogueItem } from "@/features/recipes/data";
import { cashNeededMinor, ingredientValueMinor } from "@/features/recipes/pricing";
import type { RecipeViewContext } from "@/features/recipes/view-context";
import type { RecommendationPantryItem } from "@/features/recommendations/ranking";
import { buildYouTubeTutorialSearchUrl } from "@/features/watch-cook/youtube-search";

interface RecipeDetailViewProps {
  recipe: RecipeCatalogueItem;
  personalisation: RecipePersonalisationState;
  authenticated: boolean;
  viewContext: RecipeViewContext;
  pantryItems: RecommendationPantryItem[];
  today: string;
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(value);
}

function formatKes(value: number | null) {
  return value === null ? "—" : `KES ${Math.round(value / 100).toLocaleString("en-KE")}`;
}

const reasons = [
  { icon: CircleDollarSign, title: "Clear pricing", copy: "Eat Now checks purchasable missing items against your budget", tone: "text-orange-600 bg-orange-50" },
  { icon: Check, title: "Practical ingredients", copy: "Uses familiar everyday ingredients", tone: "text-green-700 bg-green-50" },
  { icon: Clock3, title: "Time fit", copy: "Ready without taking over your day", tone: "text-red-600 bg-red-50" },
  { icon: ShieldCheck, title: "Dietary fit", copy: "Works with your food preferences", tone: "text-violet-700 bg-violet-50" },
  { icon: ShoppingCart, title: "Equipment fit", copy: "Uses basic kitchen tools", tone: "text-blue-700 bg-blue-50" },
];

export function RecipeDetailView({ recipe, personalisation, authenticated, viewContext, pantryItems, today }: RecipeDetailViewProps) {
  const [servings, setServings] = useState(viewContext.servings);
  const [tab, setTab] = useState<"ingredients" | "nutrition">("ingredients");
  const ratio = servings / recipe.baseServings;
  const optional = recipe.ingredients.filter((ingredient) => ingredient.isOptional);
  const required = recipe.ingredients.filter((ingredient) => !ingredient.isOptional);
  const pantryAware = viewContext.source === "eat-now";
  const displayedCostMinor = pantryAware
    ? cashNeededMinor(recipe, pantryItems, servings, today)
    : ingredientValueMinor(recipe, servings);
  const sourceHref =
    viewContext.source === "discover" ? "/discover" :
    viewContext.source === "meal-plan" ? "/meal-plan" :
    viewContext.source === "saved" ? "/my-kitchen/saved" :
    viewContext.source === "eat-now" ? "/eat-now" :
    "/discover";
  const sourceLabel =
    viewContext.source === "discover" ? "Discover" :
    viewContext.source === "meal-plan" ? "Meal Plan" :
    viewContext.source === "saved" ? "Saved Meals" :
    viewContext.source === "eat-now" ? "Eat Now" :
    "Discover";
  function hrefForServings(nextServings: number) {
    const params = new URLSearchParams({ servings: String(nextServings) });
    if (viewContext.source !== "direct") params.set("source", viewContext.source);
    return `/recipes/${recipe.slug}?${params}`;
  }
  const currentHref = hrefForServings(servings);
  function updateServings(nextServings: number) {
    setServings(nextServings);
    window.history.replaceState(null, "", hrefForServings(nextServings));
  }
  const youtubeUrl = buildYouTubeTutorialSearchUrl({
    recipeName: recipe.name,
    language: "english",
    maxMinutes: Math.min(120, Math.max(10, Math.ceil(recipe.totalMinutes / 5) * 5)),
    skill: recipe.difficulty as "easy" | "moderate",
    equipment: recipe.requiredEquipment[0],
    dietaryTerms: recipe.dietaryTags,
  });

  return (
    <article className="-mx-4 -my-4 overflow-hidden bg-card sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">
      <div className="xl:grid xl:grid-cols-[minmax(0,1.75fr)_minmax(22rem,.85fr)]">
        <div className="min-w-0">
          <section className="relative overflow-hidden md:min-h-[25rem]">
            <div
              data-testid="recipe-hero-image"
              className="relative h-60 overflow-hidden sm:h-72 md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[52%] xl:w-[52%]"
            >
              {recipe.image ? (
                <Image
                  src={recipe.image.path}
                  alt={recipe.image.alt}
                  fill
                  preload
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 52vw, 37vw"
                  className="object-cover object-center"
                />
              ) : <div className="grid h-full place-items-center bg-secondary text-sm text-muted-foreground">Image unavailable</div>}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-card via-card/80 to-transparent md:inset-y-0 md:left-0 md:h-auto md:w-[44%] md:bg-gradient-to-r md:via-card/75" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-12 bg-gradient-to-t from-card/90 to-transparent md:block" aria-hidden="true" />
            </div>

            <div className="relative z-10 px-5 pb-7 sm:px-8 md:flex md:min-h-[25rem] md:w-[62%] md:flex-col md:justify-center md:py-8 xl:w-[60%]">
              <Button asChild variant="ghost" className="-ml-3 mb-4 w-fit text-primary hover:text-primary">
                <Link href={sourceHref}><ArrowLeft aria-hidden="true" />Back to {sourceLabel}</Link>
              </Button>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Match 1</span>
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-foreground">{recipe.cuisine}</span>
                {recipe.costCapturedOn ? <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800">Prices checked {recipe.costCapturedOn}</span> : null}
              </div>
              <h1 className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{recipe.name}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{recipe.summary}</p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                {[
                  [CircleDollarSign, formatKes(displayedCostMinor), pantryAware ? "Cash needed" : "Ingredient value"],
                  [Clock3, `${recipe.totalMinutes} min`, "Prep + cook"],
                  [UsersRound, String(servings), "Servings"],
                  [Gauge, recipe.difficulty, "Difficulty"],
                ].map(([Icon, value, label]) => (
                  <div key={String(label)} className="flex gap-2"><Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span><strong className="block capitalize">{String(value)}</strong><small className="text-muted-foreground">{String(label)}</small></span></div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] gap-2 sm:max-w-[31rem] sm:gap-3">
                <AddToMealPlanControl authenticated={authenticated} recipeId={recipe.id} recipeName={recipe.name} recipeSlug={recipe.slug} returnTo={currentHref} />
                <CookSetupControl authenticated={authenticated} recipeId={recipe.id} recipeName={recipe.name} recipeSlug={recipe.slug} returnTo={currentHref} />
                <div>
                  <RecipePersonalisationControls recipeId={recipe.id} initialState={personalisation} authenticated={authenticated} compact detailActions returnTo={currentHref} />
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-7 px-5 py-7 sm:px-8">
            <section aria-labelledby="recommendation-reasons">
              <h2 id="recommendation-reasons" className="font-display text-xl font-semibold">Why BiteWise recommended this</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {reasons.map(({ icon: Icon, title, copy, tone }) => (
                  <div key={title} className="rounded-2xl border border-border/60 p-3 text-center">
                    <span className={`mx-auto grid size-10 place-items-center rounded-full ${tone}`}><Icon className="size-5" aria-hidden="true" /></span>
                    <h3 className="mt-2 text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby="your-kitchen">
              <h2 id="your-kitchen" className="font-display text-xl font-semibold">Recipe ingredients</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <details open className="rounded-2xl bg-green-50/80 p-4"><summary className="flex cursor-pointer list-none items-center justify-between font-bold text-green-800">Required ({required.length})<ChevronDown className="size-4" /></summary><ul className="mt-3 space-y-2 text-sm">{required.map((item) => <li key={item.id} className="flex items-center gap-2"><Check className="size-4 text-green-700" />{item.name}</li>)}</ul></details>
                <details open className="rounded-2xl bg-orange-50/80 p-4"><summary className="flex cursor-pointer list-none items-center justify-between font-bold text-red-700">Optional ({optional.length})<ChevronDown className="size-4" /></summary><ul className="mt-3 space-y-2 text-sm">{optional.length ? optional.map((item) => <li key={item.id}>{item.name}</li>) : <li>No optional extras</li>}</ul><p className="mt-4 border-t border-orange-200 pt-3 text-xs leading-5 text-muted-foreground">{pantryAware ? "Cash needed deducts your usable pantry quantities and uses practical buying increments for missing items." : "Ingredient value is the prorated raw-ingredient value for the selected servings."}</p></details>
                <div className="rounded-2xl bg-primary/5 p-4 md:col-span-2 lg:col-span-1"><h3 className="font-bold">Substitutions</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Use a close pantry alternative when one is available, without changing the spirit of the meal.</p><Button variant="outline" className="mt-4 w-full">Add missing items</Button></div>
              </div>
            </section>

            <section className="xl:hidden" aria-label="Recipe ingredients and preparation">
              <RecipeBody recipe={recipe} servings={servings} setServings={updateServings} ratio={ratio} tab={tab} setTab={setTab} youtubeUrl={youtubeUrl} />
            </section>
          </div>
        </div>

        <aside className="hidden min-w-0 px-8 py-7 xl:block">
          <RecipeBody recipe={recipe} servings={servings} setServings={updateServings} ratio={ratio} tab={tab} setTab={setTab} youtubeUrl={youtubeUrl} />
        </aside>
      </div>
      {recipe.image ? <footer className="px-5 pb-5 text-[.68rem] text-muted-foreground sm:px-8">Photo by <a className="underline" href={recipe.image.attributionUrl} target="_blank" rel="noreferrer">{recipe.image.attributionName}</a> · {recipe.image.licenseName}</footer> : null}
      {recipe.costCapturedOn ? <p className="px-5 pb-5 text-[.68rem] text-muted-foreground sm:px-8">Indicative {recipe.costLocation} ingredient prices captured {recipe.costCapturedOn}{recipe.costSourceUrl && recipe.costSourceLabel ? <> from <a className="underline" href={recipe.costSourceUrl} target="_blank" rel="noreferrer">{recipe.costSourceLabel}</a></> : null}. Actual shop prices may vary.</p> : null}
    </article>
  );
}

interface RecipeBodyProps {
  recipe: RecipeCatalogueItem;
  servings: number;
  setServings: (value: number) => void;
  ratio: number;
  tab: "ingredients" | "nutrition";
  setTab: (value: "ingredients" | "nutrition") => void;
  youtubeUrl: string;
}

function RecipeBody({ recipe, servings, setServings, ratio, tab, setTab, youtubeUrl }: RecipeBodyProps) {
  return <div className="space-y-8">
    <section>
      <div className="flex gap-7 border-b border-border/70">
        {(["ingredients", "nutrition"] as const).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`border-b-2 px-1 pb-3 text-sm font-bold capitalize ${tab === item ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{item}</button>)}
      </div>
      {tab === "ingredients" ? <>
        <div className="mt-4 flex items-center justify-between"><span className="text-sm font-bold">Serves {servings}</span><div className="flex overflow-hidden rounded-xl border border-border"><button className="grid size-10 place-items-center" aria-label="Decrease servings" onClick={() => setServings(Math.max(1, servings - 1))}><Minus className="size-4" /></button><span className="grid size-10 place-items-center border-x border-border font-bold">{servings}</span><button className="grid size-10 place-items-center" aria-label="Increase servings" onClick={() => setServings(Math.min(12, servings + 1))}><Plus className="size-4" /></button></div></div>
        <ul className="mt-3 divide-y divide-border/45">{recipe.ingredients.map((ingredient) => <li key={ingredient.id} className="flex justify-between gap-4 py-2.5 text-sm"><span className="font-semibold">{ingredient.name}{ingredient.preparation ? ` (${ingredient.preparation})` : ""}</span><span className="shrink-0 text-muted-foreground">{formatQuantity(ingredient.quantity * ratio)} {ingredient.unit}</span></li>)}</ul>
      </> : <div className="mt-4 rounded-2xl bg-secondary/60 p-5 text-sm leading-6 text-muted-foreground">Nutrition estimates are coming soon. BiteWise currently prioritises affordable, practical ingredient guidance.</div>}
      <a href={youtubeUrl} target="_blank" rel="noreferrer" className="mt-5 flex min-h-12 items-center gap-3 rounded-xl bg-primary/5 px-4 text-sm font-bold text-primary"><PlayCircle className="size-5" />Watch tutorial on YouTube<ExternalLink className="ml-auto size-4" /></a>
    </section>
    <section aria-labelledby="recipe-method"><h2 id="recipe-method" className="font-display text-xl font-semibold">Preparation</h2><p className="mt-1 text-sm text-muted-foreground">Total time: {recipe.totalMinutes} min</p><ol className="mt-5 space-y-5">{recipe.instructions.map((instruction, index) => <li key={`${index}-${instruction}`} className="grid grid-cols-[1.75rem_1fr] gap-3"><span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><div><h3 className="text-sm font-bold">{index === recipe.instructions.length - 1 ? "Finish and serve" : index === 0 ? "Get started" : "Continue cooking"}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{instruction}</p></div></li>)}</ol></section>
  </div>;
}
