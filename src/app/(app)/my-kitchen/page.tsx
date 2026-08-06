import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, PackageOpen, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deletePantryItemAction } from "@/features/pantry/actions";
import { getPantryFormData, getPantryPage } from "@/features/pantry/data";
import { PantryForm } from "@/features/pantry/pantry-form";
import { pantryQuerySchema } from "@/features/pantry/schemas";

interface MyKitchenPageProps {
  searchParams: Promise<{ edit?: string; page?: string; search?: string }>;
}

type PantryItem = Awaited<ReturnType<typeof getPantryPage>>["items"][number];

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function addDaysKey(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
}

function pantryHref(page: number, search: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page > 1) params.set("page", String(page));
  return `/my-kitchen${params.size ? `?${params}` : ""}`;
}

function PantrySection({ items, title, tone }: { items: PantryItem[]; title: string; tone?: "urgent" | "expired" }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={`section-${tone ?? "fresh"}`}>
      <div className="mb-3 flex items-center gap-2">
        <h2 id={`section-${tone ?? "fresh"}`} className="font-display text-2xl font-semibold">{title}</h2>
        <Badge className={tone === "urgent" ? "bg-accent/25 text-accent-foreground" : tone === "expired" ? "bg-destructive/10 text-destructive" : undefined}>{items.length}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-card p-4 shadow-[0_12px_35px_-28px_rgba(45,39,27,0.8)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{item.ingredient.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{Number(item.quantity).toLocaleString("en-KE")} {item.unit}</p>
              </div>
              <div className="flex gap-1">
                <Button asChild size="sm" variant="ghost"><Link href={`/my-kitchen?edit=${item.id}`} aria-label={`Edit ${item.ingredient.name}`}>Edit</Link></Button>
                <form action={deletePantryItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" size="sm" variant="ghost" aria-label={`Delete ${item.ingredient.name}`} className="text-destructive"><Trash2 className="size-4" aria-hidden="true" /></Button>
                </form>
              </div>
            </div>
            {item.expiry_date ? <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden="true" />Expires {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${item.expiry_date}T00:00:00Z`))}</p> : <p className="mt-3 text-xs text-muted-foreground">No expiry date</p>}
            {item.notes ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.notes}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default async function MyKitchenPage({ searchParams }: MyKitchenPageProps) {
  const parsed = pantryQuerySchema.parse(await searchParams);
  const [{ items, total, pageSize }, { ingredients, editItem }] = await Promise.all([
    getPantryPage({ page: parsed.page, search: parsed.search }),
    getPantryFormData(parsed.edit),
  ]);
  const today = dateKey();
  const soonCutoff = addDaysKey(3);
  const expired = items.filter((item) => item.expiry_date && item.expiry_date < today);
  const expiring = items.filter((item) => item.expiry_date && item.expiry_date >= today && item.expiry_date <= soonCutoff);
  const usable = items.filter((item) => !expired.includes(item) && !expiring.includes(item));
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">My Kitchen</p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Use what you have. Waste less.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Keep ingredients accurate so BiteWise can spot useful food, reduce missing items, and prioritise what needs using soon.</p>
      </header>

      <nav aria-label="My Kitchen sections" className="flex gap-2 rounded-2xl bg-muted/70 p-1.5 sm:w-fit">
        <span aria-current="page" className="rounded-xl bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm">Pantry</span>
        <Link href="/my-kitchen/leftovers" className="px-4 py-2 text-sm font-medium text-muted-foreground">Leftovers</Link>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="rounded-[1.5rem] bg-card p-5 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-wide text-primary">{editItem ? "Update item" : "Add ingredient"}</p><h2 className="mt-1 font-display text-2xl font-semibold">{editItem ? "Keep it accurate" : "What’s in your kitchen?"}</h2></div>
            {editItem ? <Button asChild size="sm" variant="ghost"><Link href="/my-kitchen">Cancel</Link></Button> : null}
          </div>
          <PantryForm ingredients={ingredients} editItem={editItem} />
        </aside>

        <div className="min-w-0 space-y-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input name="search" defaultValue={parsed.search} placeholder="Search your pantry" className="pl-10" />
            </form>
            <p className="text-sm font-medium text-muted-foreground">{total} {total === 1 ? "item" : "items"}</p>
          </div>

          {!items.length ? (
            <section className="rounded-[1.5rem] bg-card px-6 py-14 text-center shadow-sm">
              <PackageOpen className="mx-auto size-10 text-primary/55" aria-hidden="true" />
              <h2 className="mt-4 font-display text-3xl font-semibold">{parsed.search ? "Nothing matches that search." : "Your pantry is ready for its first item."}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{parsed.search ? "Try a broader ingredient name." : "Add what you already have. Even a few ingredients make meal suggestions more useful."}</p>
            </section>
          ) : (
            <>
              <PantrySection items={expired} title="Check before using" tone="expired" />
              <PantrySection items={expiring} title="Use within 3 days" tone="urgent" />
              <PantrySection items={usable} title="In your pantry" />
            </>
          )}

          {pages > 1 ? (
            <nav aria-label="Pantry pages" className="flex items-center justify-between rounded-2xl bg-card p-3">
              <Button asChild={parsed.page > 1} variant="ghost" disabled={parsed.page <= 1}>{parsed.page > 1 ? <Link href={pantryHref(parsed.page - 1, parsed.search)}><ChevronLeft className="size-4" aria-hidden="true" />Previous</Link> : <span><ChevronLeft className="size-4" aria-hidden="true" />Previous</span>}</Button>
              <span className="text-sm font-medium text-muted-foreground">Page {parsed.page} of {pages}</span>
              <Button asChild={parsed.page < pages} variant="ghost" disabled={parsed.page >= pages}>{parsed.page < pages ? <Link href={pantryHref(parsed.page + 1, parsed.search)}>Next<ChevronRight className="size-4" aria-hidden="true" /></Link> : <span>Next<ChevronRight className="size-4" aria-hidden="true" /></span>}</Button>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
