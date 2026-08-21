import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChefHat } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCookSession } from "@/features/cook/data";
import { GuidedCookMode } from "@/features/cook/guided-cook-mode";
import { StartSessionForm } from "@/features/cook/start-session-form";
import { requireCompletedProfile } from "@/features/profile/data";

interface CookRecipePageProps {
  params: Promise<{ recipeId: string }>;
}

export default async function CookRecipePage({ params }: CookRecipePageProps) {
  const recipeId = (await params).recipeId;
  const parsed = z.coerce.number().int().positive().safeParse(recipeId);
  if (!parsed.success) notFound();
  const { identity, profile } = await requireCompletedProfile(`/cook/${recipeId}`);
  const { recipe, session, completedSteps } = await getCookSession(identity.sub, parsed.data);
  if (!recipe) notFound();
  if (!session) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Button asChild variant="ghost" className="-ml-2"><Link href="/cook"><ArrowLeft className="size-4" aria-hidden="true" />Back to Cook</Link></Button>
        <Card className="p-6 text-center sm:p-10">
          <ChefHat className="mx-auto size-11 text-primary" aria-hidden="true" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">Start Cook Mode</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{recipe.name}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Choose servings before you begin. Every ingredient will scale linearly and each completed step will be saved.</p>
          <div className="mx-auto mt-6 max-w-sm"><StartSessionForm recipeId={recipe.id} defaultServings={profile.household_size} /></div>
        </Card>
      </div>
    );
  }

  return <GuidedCookMode recipe={recipe} servings={session.servings} initialStep={session.current_step} initialCompletedSteps={completedSteps} />;
}
