import Image from "next/image";
import { Clock3, Coins, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { RecipeCatalogueItem } from "@/features/recipes/data";

interface RecipeCatalogueCardProps {
  recipe: RecipeCatalogueItem;
}

function formatKes(minor: number | null) {
  if (minor === null) return "Price unavailable";
  return `KES ${Math.ceil(minor / 100).toLocaleString("en-KE")}`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function RecipeCatalogueCard({ recipe }: RecipeCatalogueCardProps) {
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {recipe.image ? (
          <Image
            src={recipe.image.path}
            alt={recipe.image.alt}
            fill
            sizes="(max-width: 767px) 92vw, (max-width: 1199px) 44vw, 30vw"
            className="object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Image unavailable
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-4 pb-4 pt-12 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            {formatLabel(recipe.cuisine)}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">
            {recipe.name}
          </h2>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {recipe.summary}
        </p>

        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary/65 p-3 text-xs">
          <span className="flex items-center gap-1.5 font-semibold">
            <Clock3 aria-hidden="true" className="size-4 text-primary" />
            {recipe.totalMinutes} min
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <UsersRound aria-hidden="true" className="size-4 text-primary" />
            {recipe.baseServings}
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Coins aria-hidden="true" className="size-4 text-primary" />
            {formatKes(recipe.estimatedCostPerServingMinor)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {recipe.mealTypes.map((mealType) => (
            <Badge key={mealType}>{formatLabel(mealType)}</Badge>
          ))}
          <Badge className="bg-accent/20 text-accent-foreground">
            {formatLabel(recipe.difficulty)}
          </Badge>
        </div>

        <div className="border-t border-border/70 pt-3 text-xs leading-5 text-muted-foreground">
          <p>
            Ingredient value {formatKes(recipe.estimatedCostMinor)} in {recipe.costLocation}
            {recipe.costCapturedOn ? ` · updated ${recipe.costCapturedOn}` : ""}.
          </p>
          {recipe.image ? (
            <p className="mt-1">
              Photo by{" "}
              <a
                className="font-semibold underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={recipe.image.attributionUrl}
                target="_blank"
                rel="noreferrer"
              >
                {recipe.image.attributionName}
              </a>{" "}
              ·{" "}
              <a
                className="font-semibold underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={recipe.image.licenseUrl}
                target="_blank"
                rel="noreferrer"
              >
                {recipe.image.licenseName}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
