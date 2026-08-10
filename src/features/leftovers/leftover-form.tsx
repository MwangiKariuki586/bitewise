"use client";

import { useActionState } from "react";
import { LoaderCircle, Soup } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveLeftoverAction } from "@/features/leftovers/actions";
import { initialActionResult } from "@/lib/action-result";

interface LeftoverEditItem { id: number; name: string; recipe_id: number | null; servings: number; prepared_date: string; expiry_date: string; notes: string | null }
interface LeftoverRecipeOption { id: number; name: string }

function ErrorText({ errors }: { errors?: string[] }) { return errors?.length ? <p className="text-xs font-medium text-destructive">{errors[0]}</p> : null; }

export function LeftoverForm({ item, today, recipes }: { item: LeftoverEditItem | null; today: string; recipes: LeftoverRecipeOption[] }) {
  const [state, action, pending] = useActionState(saveLeftoverAction, initialActionResult);
  return (
    <form action={action} className="space-y-4" noValidate>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="space-y-2"><Label htmlFor="name">Meal or dish <span className="font-normal text-muted-foreground">(or choose below)</span></Label><Input id="name" name="name" defaultValue={item?.name ?? ""} placeholder="For example: bean stew" /><ErrorText errors={state.fieldErrors?.name} /></div>
      <div className="space-y-2">
        <Label htmlFor="recipeId">BiteWise recipe <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <select id="recipeId" name="recipeId" defaultValue={item?.recipe_id ?? ""} className="h-12 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">No linked recipe</option>
          {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
        </select>
      </div>
      <div className="space-y-2"><Label htmlFor="servings">Servings left</Label><Input id="servings" name="servings" type="number" inputMode="decimal" min="0.25" step="0.25" defaultValue={item?.servings ?? ""} /><ErrorText errors={state.fieldErrors?.servings} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label htmlFor="preparedDate">Prepared</Label><Input id="preparedDate" name="preparedDate" type="date" defaultValue={item?.prepared_date ?? today} /><ErrorText errors={state.fieldErrors?.preparedDate} /></div>
        <div className="space-y-2"><Label htmlFor="expiryDate">Use by</Label><Input id="expiryDate" name="expiryDate" type="date" defaultValue={item?.expiry_date ?? today} /><ErrorText errors={state.fieldErrors?.expiryDate} /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label><textarea id="notes" name="notes" rows={2} maxLength={500} defaultValue={item?.notes ?? ""} className="w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "rounded-xl bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive" : "rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground"}>{state.message}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Soup className="size-4" aria-hidden="true" />}{pending ? "Saving…" : item ? "Update leftover" : "Save leftover"}</Button>
    </form>
  );
}
