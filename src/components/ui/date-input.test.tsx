import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DateInput } from "@/components/ui/date-input";

describe("DateInput", () => {
  it("opens the native calendar when the field is clicked", () => {
    render(<DateInput aria-label="Expiry date" />);
    const input = screen.getByLabelText("Expiry date") as HTMLInputElement;
    const showPicker = vi.fn();
    Object.defineProperty(input, "showPicker", { configurable: true, value: showPicker });

    fireEvent.click(input);

    expect(showPicker).toHaveBeenCalledOnce();
  });

  it("does not open the calendar when the field is disabled", () => {
    render(<DateInput aria-label="Expiry date" disabled />);
    const input = screen.getByLabelText("Expiry date") as HTMLInputElement;
    const showPicker = vi.fn();
    Object.defineProperty(input, "showPicker", { configurable: true, value: showPicker });

    fireEvent.click(input);

    expect(showPicker).not.toHaveBeenCalled();
  });
});
