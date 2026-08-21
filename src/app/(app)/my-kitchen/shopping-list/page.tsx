import Link from "next/link";
import { CheckCircle2, ListChecks, ShoppingBasket, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { getActiveShoppingList } from "@/features/shopping-list/data";
import { formatKes, formatShoppingWeek } from "@/features/shopping-list/format";
import { KitchenNav } from "@/features/shopping-list/kitchen-nav";
import { shoppingListPageSchema } from "@/features/shopping-list/schemas";
import { ShoppingListAddForm } from "@/features/shopping-list/shopping-list-add-form";
import { ShoppingListItemRow } from "@/features/shopping-list/shopping-list-item";
import { requireUser } from "@/lib/auth/session";

interface ShoppingListPageProps {
  searchParams: Promise<{ page?: string }>;
}

function listHref(page: number) {
  return page > 1 ? `/my-kitchen/shopping-list?page=${page}` : "/my-kitchen/shopping-list";
}

export default async function ShoppingListPage({ searchParams }: ShoppingListPageProps) {
  const rawQuery = await searchParams;
  const query = shoppingListPageSchema.parse(rawQuery);
  const returnTo = rawQuery.page
    ? `/my-kitchen/shopping-list?${new URLSearchParams({ page: rawQuery.page })}`
    : "/my-kitchen/shopping-list";
  const identity = await requireUser(returnTo);
  const list = await getActiveShoppingList(identity.sub, query.page);

  if (!list) {
    return (
      <div className="mx-auto max-w-6xl space-y-7">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">My Kitchen</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Shop once. Cook with a plan.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Turn a weekly plan into one practical list, already reduced by usable pantry stock.</p>
        </header>
        <KitchenNav active="shopping-list" />
        <Card className="px-6 py-14 text-center sm:px-10">
          <ShoppingBasket className="mx-auto size-11 text-primary/55" aria-hidden="true" />
          <h2 className="mt-4 font-display text-3xl font-semibold">No active shopping list yet.</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Open a weekly plan, then build its shopping list. BiteWise will aggregate ingredients and subtract food you can still use.</p>
          <Button asChild className="mt-6"><Link href="/meal-plan"><Sparkles className="size-4" aria-hidden="true" />Open Meal Plan</Link></Button>
        </Card>
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(list.totalItems / list.pageSize));
  const completion = list.totalItems ? Math.round((list.completedCount / list.totalItems) * 100) : 100;
  const toBuy = list.items.filter((item) => !item.isChecked);
  const completed = list.items.filter((item) => item.isChecked);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="overflow-hidden rounded-[2rem] bg-primary px-5 py-7 text-primary-foreground shadow-[0_24px_65px_-36px_rgba(17,55,39,0.9)] sm:px-8 sm:py-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/70">My Kitchen · Shopping list</p>
        <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Everything the week still needs.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/78">Plan ingredients are combined, usable pantry quantities are removed, and your own extras stay put when you refresh.</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/70">Week</p>
            <p className="mt-1 font-display text-xl font-semibold">{formatShoppingWeek(list.weekStart)}</p>
          </div>
        </div>
      </header>

      <KitchenNav active="shopping-list" />

      <section aria-label="Shopping progress" className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Estimated shop</p><p className="mt-2 font-display text-3xl font-semibold">{formatKes(list.estimatedTotalMinor)}</p><p className="mt-1 text-xs text-muted-foreground">Indicative Nairobi prices</p></Card>
        <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Progress</p><p className="mt-2 font-display text-3xl font-semibold">{list.completedCount} / {list.totalItems}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Shopping items completed" aria-valuemin={0} aria-valuemax={list.totalItems} aria-valuenow={list.completedCount}><div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${completion}%` }} /></div></Card>
        <Card className="p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Pantry-aware</p><p className="mt-2 flex items-center gap-2 font-semibold"><ListChecks className="size-5 text-primary" aria-hidden="true" />Expired food excluded</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Refresh from Meal Plan after pantry or serving changes.</p></Card>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside
          aria-label="Add shopping list item"
          className="rounded-[1.5rem] bg-card p-5 shadow-sm ring-1 ring-border/55 lg:sticky lg:top-24"
        >
          <Badge className="bg-accent/20 text-accent-foreground">Your extras</Badge><h2 className="mt-3 font-display text-2xl font-semibold">Add something else</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Household items and one-off groceries remain when the meal plan is regenerated.</p><div className="mt-5"><ShoppingListAddForm shoppingListId={list.id} /></div>
        </aside>
        <div className="min-w-0 space-y-7">
          {!list.totalItems ? <Card className="px-6 py-12 text-center"><CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 font-display text-3xl font-semibold">Your pantry covers the plan.</h2><p className="mt-2 text-sm text-muted-foreground">Add any household extras here, or return to Meal Plan to choose another week.</p></Card> : null}
          {toBuy.length ? <section aria-labelledby="shopping-to-buy" className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 id="shopping-to-buy" className="font-display text-2xl font-semibold">Still to buy</h2><Badge>{list.totalItems - list.completedCount}</Badge></div><div className="grid gap-3 xl:grid-cols-2">{toBuy.map((item) => <ShoppingListItemRow key={item.id} item={item} shoppingListId={list.id} />)}</div></section> : null}
          {completed.length ? <section aria-labelledby="shopping-completed" className="space-y-3"><div className="flex items-center gap-2"><h2 id="shopping-completed" className="font-display text-2xl font-semibold">In the basket</h2><Badge className="bg-secondary text-secondary-foreground">{list.completedCount}</Badge></div><div className="grid gap-3 xl:grid-cols-2">{completed.map((item) => <ShoppingListItemRow key={item.id} item={item} shoppingListId={list.id} />)}</div></section> : null}
          {pages > 1 ? <Pagination currentPage={query.page} totalPages={pages} getHref={listHref} ariaLabel="Shopping list pages" /> : null}
        </div>
      </div>
    </div>
  );
}
