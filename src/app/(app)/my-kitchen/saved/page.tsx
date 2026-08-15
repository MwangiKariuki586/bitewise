import Image from "next/image";
import Link from "next/link";
import { Bookmark, Clock3 } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { getSavedRecipePage } from "@/features/personalisation/data";
import { RecipePersonalisationControls } from "@/features/personalisation/controls";
import { recipeViewHref } from "@/features/recipes/view-context";
import { KitchenNav } from "@/features/shopping-list/kitchen-nav";
import { requireUser } from "@/lib/auth/session";

interface SavedMealsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SavedMealsPage({ searchParams }: SavedMealsPageProps) {
  const rawQuery = await searchParams;
  const query = z.object({
    page: z.coerce.number().int().min(1).max(100).catch(1),
  }).parse({ page: rawQuery.page ?? 1 });
  const returnTo = rawQuery.page
    ? `/my-kitchen/saved?${new URLSearchParams({ page: rawQuery.page })}`
    : "/my-kitchen/saved";
  const identity = await requireUser(returnTo);
  const saved = await getSavedRecipePage(identity.sub, query.page);
  const pages = Math.max(1, Math.ceil(saved.total / saved.pageSize));

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">My Kitchen · Saved meals</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Keep the meals worth returning to.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Favourites from Eat Now, Discover, and Cook stay together here, ready for planning or another cooking session.</p>
      </header>
      <KitchenNav active="saved" />

      {saved.items.length ? (
        <section aria-labelledby="saved-meals" className="space-y-4">
          <div className="flex items-center justify-between gap-3"><h2 id="saved-meals" className="font-display text-3xl font-semibold">Your favourites</h2><Badge>{saved.total}</Badge></div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {saved.items.map(({ recipe, personalisation }) => (
              <Card key={recipe.id} className="overflow-hidden">
                <Link href={recipeViewHref(recipe.slug, "saved", 1)} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="relative aspect-[16/9] bg-secondary">{recipe.image ? <Image src={recipe.image.path} alt={recipe.image.alt} fill sizes="(max-width: 639px) 92vw, (max-width: 1279px) 46vw, 30vw" className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" /> : null}</div>
                  <div className="p-5 pb-3"><p className="flex items-center gap-1.5 text-xs font-bold text-primary"><Clock3 className="size-4" aria-hidden="true" />{recipe.totalMinutes} minutes</p><h3 className="mt-1 font-display text-2xl font-semibold">{recipe.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{recipe.summary}</p></div>
                </Link>
                <div className="px-5 pb-4"><RecipePersonalisationControls recipeId={recipe.id} initialState={personalisation} authenticated compact /></div>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <Card className="px-6 py-14 text-center"><Bookmark className="mx-auto size-11 text-primary/55" aria-hidden="true" /><h2 className="mt-4 font-display text-3xl font-semibold">No saved meals yet.</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Save a meal from Eat Now, Discover, or Cook and it will appear here.</p><Button asChild className="mt-6"><Link href="/discover">Discover recipes</Link></Button></Card>
      )}

      {pages > 1 ? (
        <Pagination currentPage={query.page} totalPages={pages} getHref={(page) => `/my-kitchen/saved?page=${page}`} ariaLabel="Saved meal pages" />
      ) : null}
    </div>
  );
}
