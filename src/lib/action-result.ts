export type ActionStatus = "idle" | "error" | "success";

export interface ActionResult<TData = undefined> {
  status: ActionStatus;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: TData;
}

export const initialActionResult: ActionResult = { status: "idle" };
