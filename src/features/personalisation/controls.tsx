"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, Check, History, LoaderCircle, MoreVertical, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mutateRecipePersonalisationAction } from "@/features/personalisation/actions";
import type { RecipePersonalisationState } from "@/features/personalisation/data";
import type { PersonalisationOperation } from "@/features/personalisation/schemas";

interface RecipePersonalisationControlsProps {
  recipeId: number;
  initialState: RecipePersonalisationState;
  authenticated: boolean;
  compact?: boolean;
  cardActions?: boolean;
  returnTo?: string;
}

export function RecipePersonalisationControls({
  recipeId,
  initialState,
  authenticated,
  compact = false,
  cardActions = false,
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
  if (cardActions) {
    return (
      <div className="relative">
        <div className="grid gap-2" aria-label="Meal preferences">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" size="sm" variant={state.feedback === "liked" ? "default" : "outline"} aria-pressed={state.feedback === "liked"} disabled={pending} onClick={() => mutate(state.feedback === "liked" ? "undo_feedback" : "like")}><ThumbsUp className="size-4" />Like</Button>
            <Button type="button" size="sm" variant={state.feedback === "disliked" ? "default" : "outline"} aria-pressed={state.feedback === "disliked"} disabled={pending} onClick={() => mutate(state.feedback === "disliked" ? "undo_feedback" : "dislike")}><ThumbsDown className="size-4" />Dislike</Button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-2">
            <Button type="button" size="sm" variant={state.isSaved ? "secondary" : "outline"} aria-pressed={state.isSaved} disabled={pending} onClick={() => mutate(state.isSaved ? "unsave" : "save")}><Bookmark className="size-4" fill={state.isSaved ? "currentColor" : "none"} aria-hidden="true" />{state.isSaved ? "Saved" : "Save"}</Button>
            <details className="group relative">
              <summary aria-label="More meal actions" className="grid size-9 cursor-pointer list-none place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><MoreVertical className="size-4" aria-hidden="true" /><span className="sr-only">More meal actions</span></summary>
              <div className="absolute bottom-11 right-0 z-20 grid min-w-40 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl">
                <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => mutate("eaten")}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : state.lastEatenAt ? <Check className="size-4" /> : <History className="size-4" />}{state.lastEatenAt ? "Eaten again" : "Recently eaten"}</Button>
              </div>
            </details>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">{message}</p>
      </div>
    );
  }

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
