import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DiscoverSearchInput } from "@/features/discover/schemas";
import { discoverHref } from "@/features/discover/urls";
import {
  cuisineOptions,
  dietaryOptions,
  equipmentOptions,
} from "@/features/profile/options";

interface DiscoverSearchFormProps {
  input: DiscoverSearchInput;
}

const selectClassName = "h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25";

export function DiscoverSearchForm({ input }: DiscoverSearchFormProps) {
  const activeFilters = [
    input.q,
    input.ingredient,
    input.maxMinutes,
    input.maxCostKes,
    input.cuisine,
    input.skill,
    ...input.equipment,
    ...input.diet,
  ].filter(Boolean).length;
  const quickDiet = input.diet.includes("vegetarian")
    ? input.diet
    : [...input.diet, "vegetarian" as const];

  return (
    <form method="get" action="/discover" className="space-y-3">
      <div className="relative">
        <div className="mr-14">
          <Label htmlFor="discover-query" className="sr-only">Search recipes</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="discover-query" name="q" defaultValue={input.q} placeholder="Search pilau, chapati, beans..." className="bg-card pl-11 shadow-sm" />
          </div>
        </div>
        <Button type="submit" className="sr-only">Search recipes</Button>

        <details className="group">
        <summary className="absolute right-0 top-0 grid size-12 cursor-pointer list-none place-items-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-border/65 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span className="sr-only">Filters</span>
          {activeFilters ? (
            <span className="absolute -mr-9 -mt-9 grid size-5 place-items-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          ) : null}
        </summary>

        <div id="discover-filter-controls" className="mt-3 clear-both rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/55">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="discover-ingredient">Local ingredient</Label>
              <Input id="discover-ingredient" name="ingredient" defaultValue={input.ingredient} placeholder="e.g. sukuma, ndengu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discover-time">Maximum time</Label>
              <select id="discover-time" name="maxMinutes" defaultValue={input.maxMinutes ?? ""} className={selectClassName}>
                <option value="">Any cooking time</option>
                {[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes or less</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discover-cost">Maximum ingredient value/serving (KES)</Label>
              <Input id="discover-cost" name="maxCostKes" type="number" min={1} max={1_000_000} defaultValue={input.maxCostKes} placeholder="e.g. 250" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discover-cuisine">Cuisine</Label>
              <select id="discover-cuisine" name="cuisine" defaultValue={input.cuisine ?? ""} className={selectClassName}>
                <option value="">All cuisines</option>
                {cuisineOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discover-skill">Skill level</Label>
              <select id="discover-skill" name="skill" defaultValue={input.skill ?? ""} className={selectClassName}>
                <option value="">Any skill level</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
              </select>
            </div>
            <fieldset className="space-y-2 sm:col-span-2 xl:col-span-3">
              <legend className="text-sm font-medium">Equipment available</legend>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input className="peer sr-only" type="checkbox" name="equipment" value={option.value} defaultChecked={input.equipment.includes(option.value)} />
                    <span className="flex min-h-10 items-center rounded-full bg-secondary px-3 text-xs font-bold text-secondary-foreground ring-1 ring-transparent transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2 sm:col-span-2 xl:col-span-4">
              <legend className="text-sm font-medium">Dietary needs</legend>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <label key={option.value} className="cursor-pointer">
                    <input className="peer sr-only" type="checkbox" name="diet" value={option.value} defaultChecked={input.diet.includes(option.value)} />
                    <span className="flex min-h-10 items-center rounded-full bg-secondary px-3 text-xs font-bold text-secondary-foreground ring-1 ring-transparent transition-colors peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit">Apply filters</Button>
            {activeFilters ? <Button asChild variant="ghost"><Link href="/discover"><X className="size-4" aria-hidden="true" />Clear all</Link></Button> : null}
          </div>
        </div>
        </details>
      </div>

      <nav aria-label="Quick filters" className="flex gap-2 overflow-x-auto pb-1">
        <Link className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-card px-3 text-xs font-bold text-primary shadow-sm ring-1 ring-border/60" href={discoverHref({ ...input, maxMinutes: 30 }, 1)}>Quick (≤ 30 min)</Link>
        <Link className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-card px-3 text-xs font-bold text-primary shadow-sm ring-1 ring-border/60" href={discoverHref({ ...input, maxCostKes: 150 }, 1)}>Ingredients under KES 150/serving</Link>
        <Link className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-card px-3 text-xs font-bold text-primary shadow-sm ring-1 ring-border/60" href={discoverHref({ ...input, diet: quickDiet }, 1)}>Vegetarian</Link>
      </nav>
    </form>
  );
}
