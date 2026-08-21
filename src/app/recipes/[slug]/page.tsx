import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/navigation/app-shell";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { RecipeDetailView } from "@/features/recipes/recipe-detail-view";
import { getPublicRecipeBySlug } from "@/features/recipes/data";
import { getRecipePantryItems } from "@/features/recipes/private-data";
import { parseRecipeViewContext } from "@/features/recipes/view-context";
import {
  emptyRecipePersonalisation,
  getRecipePersonalisation,
} from "@/features/personalisation/data";
import { getSessionIdentity } from "@/lib/auth/session";

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getPublicRecipeBySlug(slug);
  return recipe
    ? { title: recipe.name, description: recipe.summary }
    : { title: "Recipe not found" };
}

export default async function RecipeDetailPage({ params, searchParams }: RecipeDetailPageProps) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const viewContext = parseRecipeViewContext(rawSearchParams);
  const [recipe, identity] = await Promise.all([
    getPublicRecipeBySlug(slug),
    getSessionIdentity(),
  ]);

  if (!recipe) notFound();

  const [personalisation, pantryItems] = await Promise.all([
    identity
      ? getRecipePersonalisation(identity.sub, [recipe.id]).then(
          (items) => items.get(recipe.id) ?? emptyRecipePersonalisation,
        )
      : Promise.resolve(emptyRecipePersonalisation),
    identity && viewContext.source === "eat-now"
      ? getRecipePantryItems(
          identity.sub,
          recipe.ingredients.filter((item) => !item.isOptional).map((item) => item.id),
        )
      : Promise.resolve([]),
  ]);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <AppShell
      accountMenu={
        <Suspense fallback={<span className="size-10 animate-pulse rounded-full bg-muted" aria-label="Loading account menu" />}>
          <ProfileMenu />
        </Suspense>
      }
    >
      <RecipeDetailView
        recipe={recipe}
        personalisation={personalisation}
        authenticated={Boolean(identity)}
        viewContext={viewContext}
        pantryItems={pantryItems}
        today={today}
      />
    </AppShell>
  );
}
