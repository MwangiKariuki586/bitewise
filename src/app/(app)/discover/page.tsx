import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";

import { PageIntro } from "@/components/product/page-intro";
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

  return (
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-7">
      <PageIntro
        eyebrow="Discover"
        title="Find a meal that fits the kitchen you have."
        description="Browse practical Kenyan recipes by time, budget, equipment, dietary needs, cuisine and more."
        variant="standard"
      />

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
        <section aria-labelledby="discover-results" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="discover-results" className="text-xs font-bold text-muted-foreground">{results.total} recipe{results.total === 1 ? "" : "s"}</h2>
            <p className="text-xs text-muted-foreground">Sort: <span className="font-bold text-primary">Relevance</span></p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
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
