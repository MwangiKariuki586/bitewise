"use client";

import { useActionState, useEffect, useRef } from "react";
import { LoaderCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pantryUnits } from "@/features/pantry/units";
import { mutateShoppingListItemAction } from "@/features/shopping-list/actions";
import { initialActionResult } from "@/lib/action-result";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.[0] ? <p className="text-xs font-medium text-destructive">{errors[0]}</p> : null;
}

export function ShoppingListAddForm({ shoppingListId }: { shoppingListId: number }) {
  const [state, action, pending] = useActionState(mutateShoppingListItemAction, initialActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      <input type="hidden" name="shoppingListId" value={shoppingListId} />
      <input type="hidden" name="operation" value="add" />
      <div className="space-y-2">
        <Label htmlFor="shopping-item-name">Item</Label>
        <Input id="shopping-item-name" name="name" placeholder="For example: dish soap" maxLength={120} />
        <FieldError errors={state.fieldErrors?.name} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="shopping-item-quantity">Quantity</Label>
          <Input id="shopping-item-quantity" name="quantity" type="number" min="0.001" step="0.001" inputMode="decimal" placeholder="1" />
          <FieldError errors={state.fieldErrors?.quantity} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shopping-item-unit">Unit</Label>
          <select id="shopping-item-unit" name="unit" defaultValue="piece" className="h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {pantryUnits.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
          </select>
          <FieldError errors={state.fieldErrors?.unit} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="shopping-item-cost">Estimated cost (KES)</Label>
        <Input id="shopping-item-cost" name="estimatedCostKes" type="number" min="0" step="0.01" inputMode="decimal" defaultValue="0" />
        <FieldError errors={state.fieldErrors?.estimatedCostMinor} />
      </div>
      {state.message ? (
        <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive" : "rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary"}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        {pending ? "Adding…" : "Add manual item"}
      </Button>
    </form>
  );
}
