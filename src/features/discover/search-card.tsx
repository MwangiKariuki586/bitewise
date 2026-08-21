import Image from "next/image";
import Link from "next/link";
import { Bookmark, Clock3, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DiscoverRecipe } from "@/features/discover/data";
import { recipeViewHref } from "@/features/recipes/view-context";

interface DiscoverSearchCardProps {
  recipe: DiscoverRecipe;
}

export function formatDiscoverLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function formatDiscoverKes(minor: number | null) {
  return minor === null
    ? "Price unavailable"
    : `KES ${Math.ceil(minor / 100).toLocaleString("en-KE")}`;
}

export function DiscoverSearchCard({ recipe }: DiscoverSearchCardProps) {
  return (
    <Card className="group min-h-[7.5rem] overflow-hidden shadow-[0_16px_44px_-36px_rgba(91,23,51,0.7)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_-34px_rgba(91,23,51,0.75)] motion-reduce:transition-none">
      <Link
        href={recipeViewHref(recipe.slug, "discover", 1)}
        aria-label={`Open ${recipe.name} to view or save`}
        className="grid min-h-[7.5rem] grid-cols-[7rem_minmax(0,1fr)] rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:grid-cols-[8rem_minmax(0,1fr)]"
      >
        <div className="relative min-h-full overflow-hidden bg-secondary">
          {recipe.image ? (
            <Image
              src={recipe.image.path}
              alt={recipe.image.alt}
              fill
              sizes="(max-width: 639px) 112px, 128px"
              className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
            />
          ) : (
            <div className="grid h-full place-items-center px-2 text-center text-xs text-muted-foreground">
              Image unavailable
            </div>
          )}
        </div>

        <div className="relative flex min-w-0 flex-col p-3 pr-9 sm:p-3.5 sm:pr-10">
          <Bookmark className="absolute right-3 top-3 size-4 text-primary" aria-hidden="true" />
          <h2 className="line-clamp-2 font-display text-base font-semibold leading-tight sm:text-lg">
            {recipe.name}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[0.68rem] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock3 className="size-3.5 text-primary" aria-hidden="true" />
              {recipe.totalMinutes} min
            </span>
            <span className="capitalize">{formatDiscoverLabel(recipe.difficulty)}</span>
            <span className="flex items-center gap-1">
              <Coins className="size-3.5 text-primary" aria-hidden="true" />
              {formatDiscoverKes(recipe.estimatedCostPerServingMinor)} ingredients/serving
            </span>
          </div>
          <div className="mt-auto flex min-w-0 flex-wrap gap-1 pt-1.5">
              {recipe.dietaryTags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  className="bg-accent/15 px-1.5 py-0.5 text-[0.6rem] text-accent-foreground"
                >
                  {formatDiscoverLabel(tag)}
                </Badge>
              ))}
          </div>
        </div>
      </Link>
    </Card>
  );
}
