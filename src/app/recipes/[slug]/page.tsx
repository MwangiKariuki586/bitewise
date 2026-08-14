import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/navigation/app-shell";
import { ProfileMenu } from "@/components/navigation/profile-menu";
import { RecipeDetailView } from "@/features/recipes/recipe-detail-view";
import { getPublicRecipeBySlug } from "@/features/recipes/data";
import {
  emptyRecipePersonalisation,
  getRecipePersonalisation,
} from "@/features/personalisation/data";
import { getSessionIdentity } from "@/lib/auth/session";

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getPublicRecipeBySlug(slug);
  return recipe
    ? { title: recipe.name, description: recipe.summary }
    : { title: "Recipe not found" };
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;
  const [recipe, identity] = await Promise.all([
    getPublicRecipeBySlug(slug),
    getSessionIdentity(),
  ]);

  if (!recipe) notFound();

  const personalisation = identity
    ? (await getRecipePersonalisation(identity.sub, [recipe.id])).get(recipe.id) ??
      emptyRecipePersonalisation
    : emptyRecipePersonalisation;

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
      />
    </AppShell>
  );
}
