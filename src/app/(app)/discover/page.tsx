import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { discoverPageSize, searchPublicRecipes } from "@/features/discover/data";
import { enforceDiscoverSearchRateLimit } from "@/features/discover/rate-limit";
import { discoverSearchSchema } from "@/features/discover/schemas";
import { DiscoverSearchCard } from "@/features/discover/search-card";
import { DiscoverSearchForm } from "@/features/discover/search-form";
import { discoverHref } from "@/features/discover/urls";

interface DiscoverPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Discover Kenyan recipes",
  description:
    "Search practical Kenyan recipes by budget, time, equipment, dietary needs, cuisine, skill, and local ingredients.",
};

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const parsed = discoverSearchSchema.safeParse(await searchParams);
  const input = parsed.success
    ? parsed.data
    : discoverSearchSchema.parse({});
  const rateLimit = await enforceDiscoverSearchRateLimit();
  const results = rateLimit.allowed
    ? await searchPublicRecipes(input)
    : { recipes: [], total: 0 };
  const pageCount = Math.max(1, Math.ceil(results.total / discoverPageSize));
  const resultStart = results.total ? (input.page - 1) * discoverPageSize + 1 : 0;
  const resultEnd = Math.min(input.page * discoverPageSize, results.total);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="grid gap-6 overflow-hidden rounded-[2rem] bg-primary px-5 py-7 text-primary-foreground shadow-[0_24px_65px_-36px_rgba(17,55,39,0.9)] sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Discover local favourites</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">Find a meal that fits the kitchen you have.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/78">Browse practical Kenyan recipes by time, equipment, dietary needs, budget, cuisine, skill, or a familiar local ingredient.</p>
        </div>
        <Badge className="w-fit bg-white/12 px-4 py-2 text-primary-foreground ring-1 ring-white/15"><Sparkles className="mr-2 size-4" aria-hidden="true" />Public recipe collection</Badge>
      </header>

      <DiscoverSearchForm input={input} />

      {!parsed.success ? (
        <Card role="alert" className="border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Some filter values were invalid, so BiteWise reset them safely.</Card>
      ) : null}

      {!rateLimit.allowed ? (
        <Card role="alert" className="px-6 py-12 text-center">
          <SearchX className="mx-auto size-10 text-primary" aria-hidden="true" />
          <h2 className="mt-4 font-display text-3xl font-semibold">Search is taking a short breather.</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">You have made several searches in the last minute. Wait briefly, then try again.</p>
        </Card>
      ) : results.recipes.length ? (
        <section aria-labelledby="discover-results" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{results.total} recipe{results.total === 1 ? "" : "s"}</p>
              <h2 id="discover-results" className="mt-1 font-display text-3xl font-semibold">Meals worth opening</h2>
            </div>
            <p className="text-sm text-muted-foreground">Showing {resultStart}–{resultEnd}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.recipes.map((recipe) => <DiscoverSearchCard key={recipe.id} recipe={recipe} />)}
          </div>
        </section>
      ) : (
        <Card className="px-6 py-14 text-center sm:px-10">
          <SearchX className="mx-auto size-11 text-primary/55" aria-hidden="true" />
          <h2 className="mt-4 font-display text-3xl font-semibold">No recipe matches every filter.</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Try a little more time, a higher per-serving budget, or remove one equipment or dietary filter.</p>
          <Button asChild className="mt-6"><Link href="/discover">Browse all recipes</Link></Button>
        </Card>
      )}

      {rateLimit.allowed && pageCount > 1 ? (
        <nav aria-label="Discover pages" className="flex items-center justify-between rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border/55">
          <Button asChild={input.page > 1} variant="ghost" disabled={input.page <= 1}>
            {input.page > 1 ? <Link href={discoverHref(input, input.page - 1)}><ChevronLeft className="size-4" aria-hidden="true" />Previous</Link> : <span><ChevronLeft className="size-4" aria-hidden="true" />Previous</span>}
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Page {input.page} of {pageCount}</span>
          <Button asChild={input.page < pageCount} variant="ghost" disabled={input.page >= pageCount}>
            {input.page < pageCount ? <Link href={discoverHref(input, input.page + 1)}>Next<ChevronRight className="size-4" aria-hidden="true" /></Link> : <span>Next<ChevronRight className="size-4" aria-hidden="true" /></span>}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
