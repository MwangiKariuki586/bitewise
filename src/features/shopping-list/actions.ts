"use server";

import { revalidatePath } from "next/cache";

import {
  mutateShoppingListItem,
  regenerateShoppingList,
} from "@/features/shopping-list/data";
import {
  generateShoppingListSchema,
  shoppingListMutationSchema,
} from "@/features/shopping-list/schemas";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/rate-limit";

function revalidateShoppingListConsumers() {
  revalidatePath("/meal-plan");
  revalidatePath("/my-kitchen");
  revalidatePath("/my-kitchen/shopping-list");
}

export async function generateShoppingListAction(
  _state: ActionResult<{ shoppingListId: number }>,
  formData: FormData,
): Promise<ActionResult<{ shoppingListId: number }>> {
  const parsed = generateShoppingListSchema.safeParse({ mealPlanId: formData.get("mealPlanId") });
  if (!parsed.success) {
    return { status: "error", message: "Choose a valid weekly plan." };
  }
  const identity = await requireUser();
  const allowed = await consumeRateLimit({
    action: "shopping_list_generation",
    identifier: identity.sub,
    limit: 20,
    windowSeconds: 600,
  });
  if (!allowed) {
    return { status: "error", message: "You have refreshed several lists. Try again in a few minutes." };
  }
  try {
    const generated = await regenerateShoppingList(parsed.data.mealPlanId);
    revalidateShoppingListConsumers();
    return {
      status: "success",
      message: generated.item_count
        ? `Shopping list ready with ${generated.item_count} items after pantry stock.`
        : "Your usable pantry stock already covers this plan.",
      data: { shoppingListId: generated.shopping_list_id },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      status: "error",
      message: message.includes("meal plan is unavailable")
        ? "That weekly plan is no longer available. Refresh the page and try again."
        : "The shopping list could not be generated. Please try again.",
    };
  }
}

export async function mutateShoppingListItemAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = shoppingListMutationSchema.safeParse({
    shoppingListId: formData.get("shoppingListId"),
    operation: formData.get("operation"),
    itemId: formData.get("itemId") || undefined,
    name: formData.get("name") || undefined,
    quantity: formData.get("quantity") || undefined,
    unit: formData.get("unit") || undefined,
    estimatedCostMinor: formData.get("estimatedCostKes") || undefined,
    isChecked: formData.get("isChecked") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted shopping-item details.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  await requireUser();
  try {
    await mutateShoppingListItem(parsed.data);
    revalidateShoppingListConsumers();
    return {
      status: "success",
      message:
        parsed.data.operation === "add"
          ? "Manual item added."
          : parsed.data.operation === "delete"
            ? "Shopping item removed."
            : parsed.data.operation === "toggle"
              ? parsed.data.isChecked ? "Item checked off." : "Item moved back to buy."
              : "Shopping item updated.",
    };
  } catch {
    return { status: "error", message: "The shopping item could not be saved. Please try again." };
  }
}
