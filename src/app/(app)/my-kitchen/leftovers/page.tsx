import Link from "next/link";
import { CalendarClock, Search, Soup, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteLeftoverAction } from "@/features/leftovers/actions";
import { getLeftoversPage } from "@/features/leftovers/data";
import { LeftoverForm } from "@/features/leftovers/leftover-form";
import { leftoverQuerySchema } from "@/features/leftovers/schemas";

interface PageProps { searchParams: Promise<{ edit?: string; page?: string; search?: string }> }
type Leftover = Awaited<ReturnType<typeof getLeftoversPage>>["items"][number];

function kenyaDateKey(date = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
function plusDays(days: number) { const date = new Date(); date.setUTCDate(date.getUTCDate() + days); return kenyaDateKey(date); }

function Group({ items, title, tone }: { items: Leftover[]; title: string; tone?: "expired" | "soon" }) {
  if (!items.length) return null;
  return <section className="space-y-3"><div className="flex items-center gap-2"><h2 className="font-display text-2xl font-semibold">{title}</h2><Badge className={tone === "expired" ? "bg-destructive/10 text-destructive" : tone === "soon" ? "bg-accent/25 text-accent-foreground" : undefined}>{items.length}</Badge></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-2xl bg-card p-4 shadow-[0_12px_35px_-28px_rgba(45,39,27,0.8)]"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-sm text-muted-foreground">{Number(item.servings)} servings</p></div><div className="flex gap-1"><Button asChild size="sm" variant="ghost"><Link href={`/my-kitchen/leftovers?edit=${item.id}`} aria-label={`Edit ${item.name}`}>Edit</Link></Button><form action={deleteLeftoverAction}><input type="hidden" name="id" value={item.id} /><Button type="submit" size="sm" variant="ghost" className="text-destructive" aria-label={`Delete ${item.name}`}><Trash2 className="size-4" aria-hidden="true" /></Button></form></div></div><p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden="true" />Use by {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${item.expiry_date}T00:00:00Z`))}</p>{tone === "expired" ? <p className="mt-2 text-xs font-semibold text-destructive">Excluded from meal recommendations</p> : null}{item.notes ? <p className="mt-2 text-xs text-muted-foreground">{item.notes}</p> : null}</article>)}</div></section>;
}

export default async function LeftoversPage({ searchParams }: PageProps) {
  const query = leftoverQuerySchema.parse(await searchParams);
  const { items, total, editItem } = await getLeftoversPage(query.page, query.search, query.edit);
  const today = kenyaDateKey(); const cutoff = plusDays(2);
  const expired = items.filter((item) => item.expiry_date < today);
  const soon = items.filter((item) => item.expiry_date >= today && item.expiry_date <= cutoff);
  const usable = items.filter((item) => item.expiry_date > cutoff);
  return <div className="mx-auto max-w-7xl space-y-7"><header><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">My Kitchen</p><h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Give good food a second meal.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Track portions and safe use-by dates. Expired leftovers remain visible for action but never count as recommendation inventory.</p></header><nav aria-label="My Kitchen sections" className="flex gap-2 rounded-2xl bg-muted/70 p-1.5 sm:w-fit"><Link href="/my-kitchen" className="px-4 py-2 text-sm font-medium text-muted-foreground">Pantry</Link><span aria-current="page" className="rounded-xl bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm">Leftovers</span></nav><div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]"><aside className="rounded-[1.5rem] bg-card p-5 shadow-sm lg:sticky lg:top-24"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl font-semibold">{editItem ? "Update leftover" : "Save a leftover"}</h2>{editItem ? <Button asChild size="sm" variant="ghost"><Link href="/my-kitchen/leftovers">Cancel</Link></Button> : null}</div><LeftoverForm item={editItem} today={today} /></aside><div className="space-y-7"><div className="flex items-center justify-between gap-3"><form className="relative w-full max-w-sm"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input name="search" defaultValue={query.search} placeholder="Search leftovers" className="pl-10" /></form><p className="shrink-0 text-sm text-muted-foreground">{total} items</p></div>{!items.length ? <section className="rounded-[1.5rem] bg-card px-6 py-14 text-center"><Soup className="mx-auto size-10 text-primary/55" aria-hidden="true" /><h2 className="mt-4 font-display text-3xl font-semibold">{query.search ? "No leftovers match." : "No leftovers to use up."}</h2><p className="mt-2 text-sm text-muted-foreground">Save extra portions here so they stay useful and visible.</p></section> : <><Group items={expired} title="Expired — discard safely" tone="expired" /><Group items={soon} title="Use within 2 days" tone="soon" /><Group items={usable} title="Ready to use" /></>}</div></div></div>;
}
