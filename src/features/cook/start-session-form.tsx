"use client";

import { useActionState } from "react";
import { ChefHat, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startCookSessionAction } from "@/features/cook/actions";
import type { ActionResult } from "@/lib/action-result";

interface StartSessionFormProps {
  recipeId: number;
  defaultServings: number;
  compact?: boolean;
}

const initialState: ActionResult = { status: "idle" };

export function StartSessionForm({ recipeId, defaultServings, compact = false }: StartSessionFormProps) {
  const [state, action, pending] = useActionState(startCookSessionAction, initialState);
  const fieldId = `cook-servings-${recipeId}`;
  return (
    <form action={action} className={compact ? "flex items-end gap-2" : "space-y-4"}>
      <input type="hidden" name="recipeId" value={recipeId} />
      <div className={compact ? "min-w-24 flex-1 space-y-1.5" : "space-y-2"}>
        <Label htmlFor={fieldId}>Servings</Label>
        <Input id={fieldId} name="servings" type="number" min={1} max={30} defaultValue={defaultServings} aria-describedby={state.message ? `${fieldId}-message` : undefined} />
      </div>
      <Button type="submit" disabled={pending} className={compact ? "h-12" : "w-full"}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ChefHat className="size-4" aria-hidden="true" />}
        {pending ? "Starting..." : "Start cooking"}
      </Button>
      {state.message ? <p id={`${fieldId}-message`} role="alert" className={`${compact ? "sr-only" : "text-sm"} text-destructive`}>{state.message}</p> : null}
    </form>
  );
}
