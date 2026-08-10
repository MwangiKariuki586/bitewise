"use client";

import { useActionState, useState } from "react";
import { Check, Circle, LoaderCircle, Pencil, RotateCcw, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pantryUnits } from "@/features/pantry/units";
import { mutateShoppingListItemAction } from "@/features/shopping-list/actions";
import type { ShoppingListItem } from "@/features/shopping-list/data";
import { formatKes, formatQuantity } from "@/features/shopping-list/format";
import { initialActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export function ShoppingListItemRow({
  item,
  shoppingListId,
}: {
  item: ShoppingListItem;
  shoppingListId: number;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(mutateShoppingListItemAction, initialActionResult);

  return (
    <article className={cn("rounded-2xl bg-card p-4 shadow-[0_14px_40px_-32px_rgba(45,39,27,0.8)] ring-1 ring-border/55", item.isChecked && "bg-muted/55 text-muted-foreground")}>
      <div className="flex items-start gap-3">
        <form action={action}>
          <input type="hidden" name="shoppingListId" value={shoppingListId} />
          <input type="hidden" name="operation" value="toggle" />
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="isChecked" value={String(!item.isChecked)} />
          <Button
            type="submit"
            size="icon"
            variant={item.isChecked ? "secondary" : "outline"}
            disabled={pending}
            aria-label={item.isChecked ? `Move ${item.name} back to buy` : `Mark ${item.name} as bought`}
            aria-pressed={item.isChecked}
            className="size-11 shrink-0 rounded-full"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : item.isChecked ? <Check className="size-5" aria-hidden="true" /> : <Circle className="size-5" aria-hidden="true" />}
          </Button>
        </form>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className={cn("font-semibold", item.isChecked && "line-through")}>{item.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatQuantity(item.quantity)} {item.unit} · {formatKes(item.estimatedCostMinor)}
              </p>
            </div>
            <Badge className={item.source === "manual" ? "bg-accent/20 text-accent-foreground" : undefined}>
              {item.source === "manual" ? "Manual" : "From plan"}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing((open) => !open)} aria-label={`${editing ? "Cancel editing" : "Edit"} ${item.name}`} aria-expanded={editing} aria-controls={`shopping-item-edit-${item.id}`}>
              {editing ? <X className="size-3.5" aria-hidden="true" /> : <Pencil className="size-3.5" aria-hidden="true" />}
              {editing ? "Cancel" : "Edit"}
            </Button>
            <form action={action}>
              <input type="hidden" name="shoppingListId" value={shoppingListId} />
              <input type="hidden" name="operation" value="delete" />
              <input type="hidden" name="itemId" value={item.id} />
              <Button type="submit" size="sm" variant="ghost" className="text-destructive" disabled={pending} aria-label={`Delete ${item.name}`}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </Button>
            </form>
          </div>
        </div>
      </div>

      {editing ? (
        <form id={`shopping-item-edit-${item.id}`} action={action} className="mt-4 grid gap-3 rounded-2xl bg-background/75 p-3 sm:grid-cols-2" noValidate>
          <input type="hidden" name="shoppingListId" value={shoppingListId} />
          <input type="hidden" name="operation" value="edit" />
          <input type="hidden" name="itemId" value={item.id} />
          {item.source === "manual" ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`shopping-name-${item.id}`}>Item name</Label>
              <Input id={`shopping-name-${item.id}`} name="name" defaultValue={item.name} maxLength={120} />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor={`shopping-quantity-${item.id}`}>Quantity for {item.name}</Label>
            <Input id={`shopping-quantity-${item.id}`} name="quantity" type="number" min="0.001" step="0.001" inputMode="decimal" defaultValue={item.quantity} />
          </div>
          {item.source === "manual" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`shopping-unit-${item.id}`}>Unit for {item.name}</Label>
              <select id={`shopping-unit-${item.id}`} name="unit" defaultValue={item.unit} className="h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {pantryUnits.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
              </select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor={`shopping-cost-${item.id}`}>Estimated cost for {item.name} (KES)</Label>
            <Input id={`shopping-cost-${item.id}`} name="estimatedCostKes" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={item.estimatedCostMinor / 100} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
              {pending ? "Saving…" : "Save item"}
            </Button>
          </div>
        </form>
      ) : null}
      {state.status === "error" && state.message ? <p role="alert" className="mt-3 text-xs font-medium text-destructive">{state.message}</p> : null}
    </article>
  );
}
