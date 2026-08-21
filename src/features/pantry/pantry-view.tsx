"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  ArrowDownUp,
  CalendarClock,
  CalendarOff,
  ChevronRight,
  Clock3,
  Filter,
  Package,
  PackageOpen,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  deletePantryItemAction,
  setPantryItemArchivedAction,
} from "@/features/pantry/actions";
import { PantryForm } from "@/features/pantry/pantry-form";
import {
  pantryCategories,
  type PantryQuery,
} from "@/features/pantry/schemas";
import { cn } from "@/lib/utils";

interface PantryIngredient {
  category: string;
  default_unit: string;
  id: number;
  name: string;
  slug: string;
}

interface PantryBatch {
  archived_at: string | null;
  created_at: string;
  expiry_date: string | null;
  id: number;
  ingredient: PantryIngredient;
  ingredient_id: number;
  notes: string | null;
  quantity: number;
  unit: string;
}

interface IngredientOption {
  category: string;
  default_unit: string;
  id: number;
  name: string;
}

interface EditPantryItem {
  expiry_date: string | null;
  id: number;
  ingredient_id: number;
  notes: string | null;
  quantity: number;
  unit: string;
}

interface PantryViewProps {
  attentionCount: number;
  editItem: EditPantryItem | null;
  ingredients: IngredientOption[];
  items: PantryBatch[];
  noExpiryCount: number;
  pageSize: number;
  query: PantryQuery;
  showDeveloperFilters: boolean;
  today: string;
  total: number;
  useSoonItems: PantryBatch[];
}

interface PantryGroup {
  batches: PantryBatch[];
  ingredient: PantryIngredient;
}

const selectSurface = "border-transparent bg-[linear-gradient(135deg,rgba(245,233,237,0.78),rgba(255,246,241,0.72))] shadow-[inset_0_0_0_1px_rgba(91,23,51,0.05)] outline-none focus-visible:ring-2 focus-visible:ring-ring/30";

function groupPantryItems(items: PantryBatch[]) {
  const groups = new Map<number, PantryGroup>();
  for (const item of items) {
    const current = groups.get(item.ingredient_id);
    if (current) current.batches.push(item);
    else groups.set(item.ingredient_id, { batches: [item], ingredient: item.ingredient });
  }
  return [...groups.values()];
}

function quantityLabel(quantity: number, unit: string) {
  const value = Number(quantity).toLocaleString("en-KE", { maximumFractionDigits: 3 });
  if (unit === "piece") return `${value} ${quantity === 1 ? "piece" : "pieces"}`;
  return `${value} ${unit}`;
}

function groupQuantity(group: PantryGroup) {
  const quantities = new Map<string, number>();
  for (const batch of group.batches) {
    quantities.set(batch.unit, (quantities.get(batch.unit) ?? 0) + Number(batch.quantity));
  }
  return [...quantities].map(([unit, quantity]) => quantityLabel(quantity, unit)).join(" + ");
}

function formatExpiry(date: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function expiryMeta(date: string | null, today: string) {
  if (!date) return { label: "No expiry date", tone: "none" as const };
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (days < 0) return { label: `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} ago`, tone: "urgent" as const };
  if (days === 0) return { label: "Expires today", tone: "urgent" as const };
  if (days <= 7) return { label: `Expires in ${days} ${days === 1 ? "day" : "days"}`, tone: "soon" as const };
  return { label: `Expires ${formatExpiry(date)}`, tone: "normal" as const };
}

function queryHref(query: PantryQuery, changes: Record<string, string | number | null>) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status !== "all") params.set("status", query.status);
  if (query.category !== "all") params.set("category", query.category);
  if (query.expiry !== "any") params.set("expiry", query.expiry);
  if (query.sort !== "expiry-soon") params.set("sort", query.sort);
  if (query.showZero) params.set("showZero", "true");
  if (query.showArchived) params.set("showArchived", "true");
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "" || value === 1) params.delete(key);
    else params.set(key, String(value));
  }
  const nextStatus = params.get("status");
  if (nextStatus === "use-soon" || nextStatus === "no-expiry") params.delete("expiry");
  return `/my-kitchen${params.size ? `?${params}` : ""}`;
}

function HiddenQueryFields({ query, omit = [] }: { query: PantryQuery; omit?: string[] }) {
  const fields = [
    ["search", query.search],
    ["status", query.status === "all" ? "" : query.status],
    ["category", query.category === "all" ? "" : query.category],
    ["expiry", query.expiry === "any" ? "" : query.expiry],
    ["sort", query.sort === "expiry-soon" ? "" : query.sort],
    ["showZero", query.showZero ? "true" : ""],
    ["showArchived", query.showArchived ? "true" : ""],
  ] as const;
  return fields.map(([name, value]) => value && !omit.includes(name) ? <input key={name} type="hidden" name={name} value={value} /> : null);
}

function InventoryActions({ batch, query }: { batch: PantryBatch; query: PantryQuery }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button asChild size="sm" variant="ghost" className="text-primary">
        <Link href={queryHref(query, { edit: batch.id })} aria-label={`Edit ${batch.ingredient.name}`}>Edit</Link>
      </Button>
      <form action={setPantryItemArchivedAction}>
        <input type="hidden" name="id" value={batch.id} />
        <input type="hidden" name="archived" value={String(!batch.archived_at)} />
        <Button type="submit" size="icon" variant="ghost" className="size-9 min-h-9" aria-label={`${batch.archived_at ? "Restore" : "Archive"} ${batch.ingredient.name}`}>
          {batch.archived_at ? <ArchiveRestore className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}
        </Button>
      </form>
      <form action={deletePantryItemAction}>
        <input type="hidden" name="id" value={batch.id} />
        <Button type="submit" size="icon" variant="ghost" className="size-9 min-h-9 text-destructive" aria-label={`Delete ${batch.ingredient.name}`}>
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}

function IngredientCard({ group, query, today, useSoon = false }: { group: PantryGroup; query: PantryQuery; today: string; useSoon?: boolean }) {
  const firstBatch = group.batches[0];
  const expiringBatch = group.batches.find((batch) => batch.expiry_date) ?? firstBatch;
  const expiry = expiryMeta(expiringBatch.expiry_date, today);
  return (
    <article className={cn(
      "rounded-2xl bg-card/88 p-3.5 shadow-[0_12px_34px_-28px_rgba(45,39,27,0.85)]",
      "lg:rounded-xl lg:px-4 lg:py-3",
      useSoon && "ring-1 ring-warning/12",
    )}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-full bg-aubergine-subtle text-primary", useSoon && "bg-surface-warm text-warning")}>
          <Package className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(12rem,1.5fr)_minmax(8rem,0.65fr)_minmax(10rem,1fr)] lg:items-center lg:gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{group.ingredient.name}</h3>
              {firstBatch.archived_at ? <Badge className="min-h-6 bg-muted px-2 text-[0.68rem]">Archived</Badge> : null}
              {Number(firstBatch.quantity) === 0 ? <Badge className="min-h-6 bg-muted px-2 text-[0.68rem]">Out of stock</Badge> : null}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{groupQuantity(group)}{group.batches.length > 1 ? " total" : ""}</p>
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground lg:mt-0">{group.batches.length > 1 ? `${group.batches.length} batches` : group.ingredient.category.replace("-", " ")}</p>
          <p className={cn(
            "mt-2 flex items-center gap-1.5 text-xs font-medium lg:mt-0",
            expiry.tone === "urgent" && "text-destructive",
            expiry.tone === "soon" && "text-warning",
            expiry.tone === "none" && "text-aubergine-soft",
            expiry.tone === "normal" && "text-muted-foreground",
          )}>
            {expiry.tone === "none" ? <CalendarOff className="size-3.5" aria-hidden="true" /> : <CalendarClock className="size-3.5" aria-hidden="true" />}
            {expiry.label}
          </p>
        </div>
        <InventoryActions batch={firstBatch} query={query} />
      </div>

      {group.batches.length > 1 ? (
        <div className="ml-15 mt-3 space-y-1.5 border-l border-border/55 pl-3">
          {group.batches.map((batch, index) => (
            <div key={batch.id} className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Batch {index + 1}</span>
              <span>{quantityLabel(Number(batch.quantity), batch.unit)}</span>
              <span aria-hidden="true">·</span>
              <span className="min-w-0 truncate">{batch.expiry_date ? formatExpiry(batch.expiry_date) : "No expiry date"}</span>
              {index ? <InventoryActions batch={batch} query={query} /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function FilterPanel({ open, onOpenChange, query, showDeveloperFilters }: { open: boolean; onOpenChange: (open: boolean) => void; query: PantryQuery; showDeveloperFilters: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(query.status);
  const [expiry, setExpiry] = useState(query.expiry);
  const statusOptions = [
    ["all", "All"],
    ["use-soon", "Use soon"],
    ["no-expiry", "No expiry"],
    ["in-stock", "In stock"],
  ] as const;
  const expiryLocked = status === "use-soon" || status === "no-expiry";
  const effectiveExpiry = status === "use-soon" ? "7-days" : status === "no-expiry" ? "no-expiry" : expiry;
  const expiryHint = status === "use-soon"
    ? "Use soon includes items expiring today through the next 7 days."
    : status === "no-expiry"
      ? "No expiry shows items without an expiry date."
      : "";

  function changeStatus(value: PantryQuery["status"]) {
    setStatus(value);
    if (value === "use-soon" || value === "no-expiry") setExpiry("any");
  }

  function changeExpiry(value: PantryQuery["expiry"]) {
    setExpiry(value);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[1.75rem] bg-card p-5 shadow-2xl focus:outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[25rem] sm:max-h-none sm:rounded-none sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-2xl font-semibold">Filters</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">Narrow the inventory without changing its sort order.</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button size="icon" variant="ghost" aria-label="Close filters"><X className="size-5" aria-hidden="true" /></Button></Dialog.Close>
          </div>
          <form
            className="mt-7 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              const params = new URLSearchParams();
              const data = new FormData(event.currentTarget);
              for (const [name, value] of data.entries()) if (String(value)) params.set(name, String(value));
              router.push(`/my-kitchen${params.size ? `?${params}` : ""}`);
              onOpenChange(false);
            }}
          >
            <HiddenQueryFields query={query} omit={["status", "category", "expiry", "showZero", "showArchived"]} />
            <fieldset>
              <legend className="text-sm font-semibold">Status</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusOptions.map(([value, label]) => (
                  <label key={value} className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name="status" value={value === "all" ? "" : value} checked={status === value} onChange={() => changeStatus(value)} />
                    <span className="inline-flex min-h-10 items-center rounded-full bg-surface-soft px-4 text-xs font-semibold text-muted-foreground ring-1 ring-transparent transition peer-checked:bg-aubergine-subtle peer-checked:text-primary peer-checked:ring-primary/35 peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block space-y-2 text-sm font-semibold">
              <span>Category</span>
              <select name="category" defaultValue={query.category === "all" ? "" : query.category} className={`h-12 w-full rounded-xl px-3.5 text-sm font-medium ${selectSurface}`}>
                <option value="">All categories</option>
                {pantryCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-semibold">
              <span>Expiry</span>
              <select
                name="expiry"
                value={effectiveExpiry === "any" ? "" : effectiveExpiry}
                disabled={expiryLocked}
                aria-describedby={expiryHint ? "pantry-expiry-filter-hint" : undefined}
                onChange={(event) => changeExpiry((event.target.value || "any") as PantryQuery["expiry"])}
                className={`h-12 w-full rounded-xl px-3.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70 ${selectSurface}`}
              >
                <option value="">Any time</option>
                <option value="expired">Expired</option>
                <option value="3-days">Next 3 days</option>
                <option value="7-days">Next 7 days</option>
                <option value="30-days">Next 30 days</option>
                <option value="no-expiry">No expiry date</option>
              </select>
              {expiryHint ? <span id="pantry-expiry-filter-hint" className="block text-xs font-normal text-muted-foreground">{expiryHint}</span> : null}
            </label>
            {showDeveloperFilters
              ? [["showZero", "Show zero quantity", query.showZero], ["showArchived", "Show archived", query.showArchived]].map(([name, label, checked]) => (
                  <label key={String(name)} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                    <span>{String(label)}</span>
                    <span className="relative inline-flex">
                      <input className="peer sr-only" type="checkbox" name={String(name)} value="true" defaultChecked={Boolean(checked)} />
                      <span className="h-7 w-12 rounded-full bg-muted shadow-inner transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                    </span>
                  </label>
                ))
              : null}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => { router.push(queryHref(query, { status: null, category: null, expiry: null, showZero: null, showArchived: null, page: null })); onOpenChange(false); }}>Clear all</Button>
              <Button type="submit">Apply filters</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PantryView({ attentionCount, editItem, ingredients, items, noExpiryCount, pageSize, query, showDeveloperFilters, today, total, useSoonItems }: PantryViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(Boolean(editItem));
  const [filterOpen, setFilterOpen] = useState(false);
  const openedEditId = useRef<number | null>(null);
  const groups = useMemo(() => groupPantryItems(items), [items]);
  const useSoonGroups = useMemo(() => groupPantryItems(useSoonItems), [useSoonItems]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilterCount = Number(query.status !== "all") + Number(query.category !== "all") + Number(query.expiry !== "any") + Number(query.showZero) + Number(query.showArchived);

  useEffect(() => {
    if (editItem && openedEditId.current !== editItem.id) {
      openedEditId.current = editItem.id;
      setFormOpen(true);
    } else if (!editItem) {
      openedEditId.current = null;
    }
  }, [editItem]);

  const closeEditRoute = useCallback(() => {
    if (!editItem) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }, [editItem, pathname, router, searchParams]);

  const handleSaved = useCallback((message: string) => {
    toast.success(message);
    setFormOpen(false);
    closeEditRoute();
  }, [closeEditRoute]);

  function changeSort(value: string) {
    router.push(queryHref(query, { sort: value === "expiry-soon" ? null : value, page: null }));
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {attentionCount > 0 || noExpiryCount > 0 ? (
        <div className={cn("grid gap-3", attentionCount > 0 && noExpiryCount > 0 && "sm:grid-cols-2")} aria-label="Pantry alerts">
          {attentionCount > 0 ? (
            <Link
              href={queryHref(query, { status: "use-soon", expiry: null, page: null })}
              className="group flex min-h-14 items-center gap-3 rounded-2xl bg-card/78 px-4 shadow-[0_10px_28px_-24px_rgba(45,39,27,0.75)] transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Clock3 className="size-5 text-warning" aria-hidden="true" />
              <span className="flex-1 text-sm font-medium">{attentionCount} {attentionCount === 1 ? "item needs" : "items need"} attention this week</span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : null}
          {noExpiryCount > 0 ? (
            <Link
              href={queryHref(query, { status: "no-expiry", expiry: null, page: null })}
              className="group flex min-h-14 items-center gap-3 rounded-2xl bg-card/78 px-4 shadow-[0_10px_28px_-24px_rgba(45,39,27,0.75)] transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CalendarOff className="size-5 text-aubergine-soft" aria-hidden="true" />
              <span className="flex-1 text-sm font-medium">{noExpiryCount} {noExpiryCount === 1 ? "item has" : "items have"} no expiry date</span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl bg-card/65 p-2 shadow-[0_12px_32px_-28px_rgba(45,39,27,0.8)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(15rem,1fr)_auto_auto_auto]">
          <form action="/my-kitchen" className="relative">
            <HiddenQueryFields query={query} omit={["search"]} />
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input name="search" defaultValue={query.search} placeholder="Search your pantry" aria-label="Search pantry" className="border-border/65 bg-background/75 pl-10 shadow-none" />
          </form>
          <Button type="button" className="sm:order-4" onClick={() => setFormOpen(true)}><Plus className="size-4" aria-hidden="true" />Add ingredient</Button>
          <Button type="button" variant="outline" className="hidden bg-background/65 shadow-none sm:inline-flex" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />Filter{activeFilterCount ? <Badge className="min-h-5 bg-primary px-1.5 text-[0.65rem] text-primary-foreground">{activeFilterCount}</Badge> : null}
          </Button>
          <label className="relative hidden sm:block">
            <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <select aria-label="Sort pantry" value={query.sort} onChange={(event) => changeSort(event.target.value)} className="h-11 min-w-40 appearance-none rounded-xl border border-border bg-background/65 py-0 pl-9 pr-8 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="expiry-soon">Expiry soon</option>
              <option value="recently-added">Recently added</option>
              <option value="quantity-high">Quantity: high</option>
            </select>
          </label>
        </div>
      </div>

      {useSoonGroups.length ? (
        <section aria-labelledby="use-soon-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2"><h2 id="use-soon-heading" className="font-display text-2xl font-semibold">Use soon</h2><Badge className="px-2.5">{useSoonGroups.length}</Badge></div>
              <p className="mt-1 text-sm text-muted-foreground">Closest expiry dates first.</p>
            </div>
            <Link href={queryHref(query, { status: "use-soon", page: null })} className="text-sm font-semibold text-primary">View all</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            {useSoonGroups.map((group) => <IngredientCard key={group.ingredient.id} group={group} query={query} today={today} useSoon />)}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all-ingredients-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><h2 id="all-ingredients-heading" className="font-display text-2xl font-semibold">All ingredients</h2><Badge className="px-2.5">{groups.length}</Badge></div>
            <p className="mt-1 text-sm text-muted-foreground">Grouped by ingredient, with batches shown together.</p>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Button type="button" size="sm" variant="ghost" onClick={() => setFilterOpen(true)}><Filter className="size-4" aria-hidden="true" />Filter{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button>
            <label className="relative">
              <span className="sr-only">Sort pantry</span>
              <select aria-label="Sort pantry" value={query.sort} onChange={(event) => changeSort(event.target.value)} className="h-9 appearance-none bg-transparent pl-2 pr-6 text-xs font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="expiry-soon">Expiry soon</option>
                <option value="recently-added">Recently added</option>
                <option value="quantity-high">Quantity: high</option>
              </select>
            </label>
          </div>
        </div>

        {!groups.length ? (
          <div className="rounded-2xl bg-card/72 px-6 py-14 text-center shadow-[0_12px_34px_-28px_rgba(45,39,27,0.8)]">
            <PackageOpen className="mx-auto size-10 text-primary/55" aria-hidden="true" />
            <h3 className="mt-4 font-display text-3xl font-semibold">{query.search || activeFilterCount ? "Nothing matches these pantry controls." : "Your pantry is ready for its first item."}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{query.search || activeFilterCount ? "Try a broader search or clear a filter." : "Add what you already have. Even a few ingredients make meal suggestions more useful."}</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            {groups.map((group) => <IngredientCard key={group.ingredient.id} group={group} query={query} today={today} />)}
          </div>
        )}
      </section>

      {pages > 1 ? <Pagination currentPage={query.page} totalPages={pages} getHref={(page) => queryHref(query, { page })} ariaLabel="Pantry pages" /> : null}
      <p className="text-center text-xs italic text-muted-foreground">Expiry dates are estimates. Always check before use.</p>

      <FilterPanel key={`${query.status}-${query.expiry}-${filterOpen ? "open" : "closed"}`} open={filterOpen} onOpenChange={setFilterOpen} query={query} showDeveloperFilters={showDeveloperFilters} />

      <Dialog.Root open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) closeEditRoute(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed inset-0 z-50 overflow-y-auto bg-card p-5 focus:outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[29rem] sm:p-7 sm:shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{editItem ? "Update item" : "Add ingredient"}</p>
                <Dialog.Title className="mt-1 font-display text-3xl font-semibold">{editItem ? "Keep it accurate" : "What’s in your kitchen?"}</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">Add the quantity you have now. Expiry and notes stay optional.</Dialog.Description>
              </div>
              <Dialog.Close asChild><Button size="icon" variant="ghost" aria-label="Close ingredient form"><X className="size-5" aria-hidden="true" /></Button></Dialog.Close>
            </div>
            <div className="mt-7"><PantryForm key={editItem ? `edit-${editItem.id}` : formOpen ? "new-open" : "new"} ingredients={ingredients} editItem={editItem} onSaved={handleSaved} /></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
