"use client";

import { useActionState, useEffect, useState } from "react";
import { LoaderCircle, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePantryItemAction } from "@/features/pantry/actions";
import { pantryUnits } from "@/features/pantry/units";
import { initialActionResult } from "@/lib/action-result";

interface IngredientOption {
  default_unit: string;
  id: number;
  name: string;
}

interface EditPantryItem {
  expiry_date: string | null;
  id: number;
  ingredient_id: number;
  notes: string | null;
  quantity: number;
  unit: string;
}

interface PantryFormProps {
  editItem: EditPantryItem | null;
  ingredients: IngredientOption[];
  onSaved?: (message: string) => void;
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="text-xs font-medium text-destructive">{errors[0]}</p> : null;
}

const formControlClass = "border-transparent bg-[linear-gradient(135deg,rgba(245,233,237,0.78),rgba(255,246,241,0.72))] shadow-[inset_0_0_0_1px_rgba(91,23,51,0.05)] focus-visible:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:bg-muted disabled:opacity-60";

export function PantryForm({ editItem, ingredients, onSaved }: PantryFormProps) {
  const initialIngredient = editItem?.ingredient_id ?? ingredients[0]?.id ?? 0;
  const initialUnit = editItem?.unit ?? ingredients.find(({ id }) => id === initialIngredient)?.default_unit ?? "g";
  const [unit, setUnit] = useState(initialUnit);
  const [state, formAction, pending] = useActionState(savePantryItemAction, initialActionResult);

  useEffect(() => {
    if (state.status === "success" && state.message) onSaved?.(state.message);
  }, [onSaved, state.message, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      {editItem ? <input type="hidden" name="id" value={editItem.id} /> : null}
      <div className="space-y-2">
        <Label htmlFor="ingredientId">Ingredient</Label>
        <select
          id="ingredientId"
          name="ingredientId"
          defaultValue={initialIngredient}
          onChange={(event) => {
            const ingredient = ingredients.find(({ id }) => id === Number(event.target.value));
            if (ingredient) setUnit(ingredient.default_unit);
          }}
          className={`h-12 w-full rounded-xl border px-3.5 text-sm outline-none ${formControlClass}`}
        >
          {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
        </select>
        <FieldError errors={state.fieldErrors?.ingredientId} />
      </div>

      <div className="grid grid-cols-[1fr_1.25fr] gap-3">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input className={formControlClass} id="quantity" name="quantity" type="number" inputMode="decimal" min={editItem ? "0" : "0.001"} step="0.001" defaultValue={editItem?.quantity ?? ""} placeholder="2" required />
          <FieldError errors={state.fieldErrors?.quantity} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <select id="unit" name="unit" value={unit} onChange={(event) => setUnit(event.target.value)} className={`h-12 w-full rounded-xl border px-3.5 text-sm outline-none ${formControlClass}`}>
            {pantryUnits.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <FieldError errors={state.fieldErrors?.unit} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiryDate">Expiry date <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <DateInput className={formControlClass} id="expiryDate" name="expiryDate" defaultValue={editItem?.expiry_date ?? ""} />
        <FieldError errors={state.fieldErrors?.expiryDate} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <textarea id="notes" name="notes" rows={3} maxLength={300} defaultValue={editItem?.notes ?? ""} placeholder="For example: opened packet" className={`w-full resize-y rounded-xl border px-3.5 py-3 text-sm outline-none ${formControlClass}`} />
        <FieldError errors={state.fieldErrors?.notes} />
      </div>

      {state.status === "error" && state.message ? (
        <p role="alert" className="rounded-xl bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending || !ingredients.length}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <PackagePlus className="size-4" aria-hidden="true" />}
        {pending ? "Saving…" : editItem ? "Update pantry item" : "Add to pantry"}
      </Button>
    </form>
  );
}
