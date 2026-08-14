"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, Check, History, LoaderCircle, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mutateRecipePersonalisationAction } from "@/features/personalisation/actions";
import type { RecipePersonalisationState } from "@/features/personalisation/data";
import type { PersonalisationOperation } from "@/features/personalisation/schemas";

interface RecipePersonalisationControlsProps {
  recipeId: number;
  initialState: RecipePersonalisationState;
  authenticated: boolean;
  compact?: boolean;
  returnTo?: string;
}

export function RecipePersonalisationControls({
  recipeId,
  initialState,
  authenticated,
  compact = false,
  returnTo = "/eat-now",
}: RecipePersonalisationControlsProps) {
  const [state, setState] = useState(initialState);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (!authenticated) {
    return (
      <Button asChild variant="outline" size={compact ? "sm" : "default"}>
        <Link href={`/auth/sign-in?${new URLSearchParams({ next: returnTo })}`}>
          Sign in to save
        </Link>
      </Button>
    );
  }

  function mutate(operation: PersonalisationOperation) {
    if (pending) return;
    startTransition(async () => {
      const result = await mutateRecipePersonalisationAction({ recipeId, operation });
      if (result.status === "success" && result.data) setState(result.data);
      setMessage(result.message ?? "");
    });
  }

  const buttonSize = compact ? "sm" : "default";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2" aria-label="Meal preferences">
        <Button
          type="button"
          size={buttonSize}
          variant={state.feedback === "liked" ? "default" : "outline"}
          aria-pressed={state.feedback === "liked"}
          disabled={pending}
          onClick={() => mutate(state.feedback === "liked" ? "undo_feedback" : "like")}
        >
          <ThumbsUp className="size-4" aria-hidden="true" />Like
        </Button>
        <Button
          type="button"
          size={buttonSize}
          variant={state.feedback === "disliked" ? "default" : "outline"}
          className={state.feedback === "disliked" ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
          aria-pressed={state.feedback === "disliked"}
          disabled={pending}
          onClick={() => mutate(state.feedback === "disliked" ? "undo_feedback" : "dislike")}
        >
          <ThumbsDown className="size-4" aria-hidden="true" />Dislike
        </Button>
        <Button
          type="button"
          size={buttonSize}
          variant={state.isSaved ? "secondary" : "outline"}
          aria-pressed={state.isSaved}
          disabled={pending}
          onClick={() => mutate(state.isSaved ? "unsave" : "save")}
        >
          <Bookmark className="size-4" fill={state.isSaved ? "currentColor" : "none"} aria-hidden="true" />{state.isSaved ? "Saved" : "Save"}
        </Button>
        <Button type="button" size={buttonSize} variant="ghost" disabled={pending} onClick={() => mutate("eaten")}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : state.lastEatenAt ? <Check className="size-4" aria-hidden="true" /> : <History className="size-4" aria-hidden="true" />}
          {state.lastEatenAt ? "Eaten again" : "Recently eaten"}
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-xs font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
