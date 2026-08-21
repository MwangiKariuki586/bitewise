"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

type DateInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

function DateInput({ onClick, ...props }: DateInputProps) {
  function openCalendar(event: React.MouseEvent<HTMLInputElement>) {
    onClick?.(event);
    const input = event.currentTarget;
    if (event.defaultPrevented || input.disabled || input.readOnly || typeof input.showPicker !== "function") return;

    try {
      input.showPicker();
    } catch {
      // Retain the browser's native date-input behavior when showPicker is unavailable.
    }
  }

  return <Input {...props} type="date" onClick={openCalendar} />;
}

export { DateInput };
