import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Coins, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DiscoverRecipe } from "@/features/discover/data";

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
    <Card className="group overflow-hidden shadow-[0_18px_52px_-38px_rgba(24,64,45,0.75)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-34px_rgba(24,64,45,0.82)] motion-reduce:transition-none">
      <Link
        href={`/recipes/${recipe.slug}`}
        className="block rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {recipe.image ? (
            <Image
              src={recipe.image.path}
              alt={recipe.image.alt}
              fill
              sizes="(max-width: 639px) 92vw, (max-width: 1199px) 46vw, 30vw"
              className="object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">Image unavailable</div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 pb-5 pt-16 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/75">
              {formatDiscoverLabel(recipe.cuisine)}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">{recipe.name}</h2>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">{recipe.summary}</p>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-secondary/65 p-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary" aria-hidden="true" />{recipe.totalMinutes} min</span>
            <span className="flex items-center gap-1.5"><UsersRound className="size-4 text-primary" aria-hidden="true" />{recipe.baseServings}</span>
            <span className="flex items-center gap-1.5"><Coins className="size-4 text-primary" aria-hidden="true" />{formatDiscoverKes(recipe.estimatedCostPerServingMinor)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{formatDiscoverLabel(recipe.difficulty)}</Badge>
              {recipe.dietaryTags.slice(0, 1).map((tag) => <Badge key={tag} className="bg-accent/20 text-accent-foreground">{formatDiscoverLabel(tag)}</Badge>)}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">View recipe<ArrowUpRight className="size-4" aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
