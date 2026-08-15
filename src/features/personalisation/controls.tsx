"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
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
  detailActions?: boolean;
  returnTo?: string;
}

interface PersonalisationSyncDetail {
  recipeId: number;
  state: RecipePersonalisationState;
}

const personalisationSyncEvent = "bitewise:recipe-personalisation";
const eatNowStorageKey = "bitewise:eat-now-state";

function syncStoredEatNowState(recipeId: number, nextState: RecipePersonalisationState) {
  try {
    const raw = sessionStorage.getItem(eatNowStorageKey);
    if (!raw) return;
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null || !("result" in stored)) return;
    const result = stored.result;
    if (typeof result !== "object" || result === null || !("data" in result)) return;
    const data = result.data;
    if (typeof data !== "object" || data === null || !("meals" in data) || !Array.isArray(data.meals)) return;
    const meals = data.meals.map((meal: unknown) => {
      if (typeof meal !== "object" || meal === null || !("id" in meal) || meal.id !== recipeId) return meal;
      return { ...meal, personalisation: nextState };
    });
    sessionStorage.setItem(eatNowStorageKey, JSON.stringify({ ...stored, result: { ...result, data: { ...data, meals } } }));
  } catch {
    sessionStorage.removeItem(eatNowStorageKey);
  }
}

export function RecipePersonalisationControls({
  recipeId,
  initialState,
  authenticated,
  compact = false,
  cardActions = false,
  detailActions = false,
  returnTo = "/eat-now",
}: RecipePersonalisationControlsProps) {
  const [state, setState] = useState(initialState);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const router = useRouter();
  const signInHref = `/auth/sign-in?${new URLSearchParams({ next: returnTo })}`;

  useEffect(() => {
    function handleSync(event: Event) {
      const detail = (event as CustomEvent<PersonalisationSyncDetail>).detail;
      if (detail.recipeId === recipeId) setState(detail.state);
    }
    window.addEventListener(personalisationSyncEvent, handleSync);
    return () => window.removeEventListener(personalisationSyncEvent, handleSync);
  }, [recipeId]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  if (!authenticated && !detailActions) {
    return (
      <Button asChild variant="outline" size={compact ? "sm" : "default"}>
        <Link href={signInHref}>
          Sign in to save
        </Link>
      </Button>
    );
  }

  function mutate(operation: PersonalisationOperation) {
    setMenuOpen(false);
    if (!authenticated) {
      router.push(signInHref);
      return;
    }
    if (pending) return;
    startTransition(async () => {
      const result = await mutateRecipePersonalisationAction({ recipeId, operation });
      if (result.status === "success" && result.data) {
        setState(result.data);
        syncStoredEatNowState(recipeId, result.data);
        window.dispatchEvent(new CustomEvent<PersonalisationSyncDetail>(personalisationSyncEvent, {
          detail: { recipeId, state: result.data },
        }));
        router.refresh();
      }
      setMessage(result.message ?? "");
    });
  }

  const buttonSize = compact ? "sm" : "default";
  if (detailActions) {
    return (
      <div ref={menuRef} className="relative">
        <button type="button" aria-label="More recipe actions" aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen((current) => !current)} className="grid size-11 cursor-pointer place-items-center rounded-xl border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <MoreVertical className="size-4" aria-hidden="true" />
        </button>
        {menuOpen ? (
          <div id={menuId} role="menu" aria-label="Recipe actions" className="absolute bottom-12 right-0 z-30 grid min-w-44 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl">
            <Button type="button" size="sm" variant="ghost" className="justify-start" aria-pressed={state.isSaved} disabled={pending} onClick={() => mutate(state.isSaved ? "unsave" : "save")}><Bookmark className="size-4" fill={state.isSaved ? "currentColor" : "none"} />{state.isSaved ? "Saved" : "Save"}</Button>
            <Button type="button" size="sm" variant={state.feedback === "liked" ? "secondary" : "ghost"} className="justify-start" aria-pressed={state.feedback === "liked"} disabled={pending} onClick={() => mutate(state.feedback === "liked" ? "undo_feedback" : "like")}><ThumbsUp className="size-4" fill={state.feedback === "liked" ? "currentColor" : "none"} />{state.feedback === "liked" ? "Unlike" : "Like"}</Button>
            <Button type="button" size="sm" variant={state.feedback === "disliked" ? "secondary" : "ghost"} className="justify-start" aria-pressed={state.feedback === "disliked"} disabled={pending} onClick={() => mutate(state.feedback === "disliked" ? "undo_feedback" : "dislike")}><ThumbsDown className="size-4" fill={state.feedback === "disliked" ? "currentColor" : "none"} />{state.feedback === "disliked" ? "Remove dislike" : "Dislike"}</Button>
            <Button type="button" size="sm" variant="ghost" className="justify-start" disabled={pending} onClick={() => mutate("eaten")}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : state.lastEatenAt ? <Check className="size-4" /> : <History className="size-4" />}
              {state.lastEatenAt ? "Mark as eaten again" : "Mark as eaten"}
            </Button>
          </div>
        ) : null}
        <p aria-live="polite" className="sr-only">{message}</p>
      </div>
    );
  }

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
            <div ref={menuRef} className="relative">
              <button type="button" aria-label="More meal actions" aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen((current) => !current)} className="grid size-9 cursor-pointer place-items-center rounded-lg border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><MoreVertical className="size-4" aria-hidden="true" /></button>
              {menuOpen ? (
              <div id={menuId} role="menu" aria-label="Meal actions" className="absolute bottom-11 right-0 z-20 grid min-w-40 gap-1 rounded-xl border border-border bg-card p-2 shadow-xl">
                <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => mutate("eaten")}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : state.lastEatenAt ? <Check className="size-4" /> : <History className="size-4" />}{state.lastEatenAt ? "Mark as eaten again" : "Mark as eaten"}</Button>
              </div>
              ) : null}
            </div>
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
          {state.lastEatenAt ? "Mark as eaten again" : "Mark as eaten"}
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-xs font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
