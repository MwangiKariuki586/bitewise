import { getPantryFormData, getPantryHighlights, getPantryPage } from "@/features/pantry/data";
import { PantryView } from "@/features/pantry/pantry-view";
import { normalizePantryFilterConflicts, pantryQuerySchema, restrictPantryDeveloperFilters } from "@/features/pantry/schemas";
import { KitchenNav } from "@/features/shopping-list/kitchen-nav";
import { requireUser } from "@/lib/auth/session";

interface MyKitchenPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MyKitchenPage({ searchParams }: MyKitchenPageProps) {
  const rawQuery = await searchParams;
  const showDeveloperFilters = process.env.NODE_ENV === "development";
  const parsed = normalizePantryFilterConflicts(
    restrictPantryDeveloperFilters(pantryQuerySchema.parse(rawQuery), showDeveloperFilters),
  );
  const returnParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawQuery)) {
    if (typeof value === "string") returnParams.set(key, value);
  }
  await requireUser(`/my-kitchen${returnParams.size ? `?${returnParams}` : ""}`);

  const [{ items, total, pageSize }, { ingredients, editItem }, highlights] = await Promise.all([
    getPantryPage(parsed),
    getPantryFormData(parsed.edit),
    getPantryHighlights(parsed),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">My Kitchen</p>
        <h1 className="mt-2 max-w-3xl font-display text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.025em] sm:text-6xl lg:text-5xl xl:text-6xl">
          Use what you have. Waste less.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          Keep ingredients accurate so BiteWise can spot useful food, reduce missing items, and prioritise what needs using soon.
        </p>
      </header>

      <div className="mt-7 sm:mt-9"><KitchenNav active="pantry" /></div>
      <div className="mt-5 sm:mt-7">
        <PantryView
          attentionCount={highlights.attentionCount}
          editItem={editItem}
          ingredients={ingredients}
          items={items}
          noExpiryCount={highlights.noExpiryCount}
          pageSize={pageSize}
          query={parsed}
          showDeveloperFilters={showDeveloperFilters}
          today={highlights.today}
          total={total}
          useSoonItems={highlights.useSoonItems}
        />
      </div>
    </div>
  );
}
