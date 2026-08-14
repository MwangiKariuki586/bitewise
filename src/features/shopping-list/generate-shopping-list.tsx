"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ListChecks, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateShoppingListAction } from "@/features/shopping-list/actions";
import type { ActionResult } from "@/lib/action-result";

const initialState: ActionResult<{ shoppingListId: number }> = { status: "idle" };

export function GenerateShoppingList({ mealPlanId }: { mealPlanId: number }) {
  const [state, action, pending] = useActionState(generateShoppingListAction, initialState);
  return (
    <div className="space-y-2">
      <form action={action}>
        <input type="hidden" name="mealPlanId" value={mealPlanId} />
        <Button type="submit" className="h-11 min-h-11 w-full min-w-0 whitespace-nowrap rounded-xl px-2 text-[0.68rem] sm:px-4 sm:text-sm" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ListChecks className="size-4" aria-hidden="true" />
          )}
          {pending ? "Checking your pantry…" : "Build shopping list"}
        </Button>
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "error" ? "text-xs font-medium text-destructive" : "text-xs font-medium text-primary"}
        >
          {state.message}{" "}
          {state.status === "success" ? (
            <Link href="/my-kitchen/shopping-list" className="underline underline-offset-4">
              Open list
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
