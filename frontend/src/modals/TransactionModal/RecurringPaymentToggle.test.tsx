import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecurringPaymentToggle } from "./RecurringPaymentToggle";

describe("RecurringPaymentToggle", () => {
  it("turns the toggle on when it is off", async () => {
    const setIsRecurring = vi.fn();
    const user = userEvent.setup();
    render(
      <RecurringPaymentToggle
        isRecurring={false}
        setIsRecurring={setIsRecurring}
      />,
    );
    await user.click(screen.getByText("Recurring Payment"));
    expect(setIsRecurring).toHaveBeenCalledWith(true);
  });

  it("turns the toggle off when it is on", async () => {
    const setIsRecurring = vi.fn();
    const user = userEvent.setup();
    render(
      <RecurringPaymentToggle
        isRecurring={true}
        setIsRecurring={setIsRecurring}
      />,
    );
    await user.click(screen.getByText("Recurring Payment"));
    expect(setIsRecurring).toHaveBeenCalledWith(false);
  });

  it("reveals the coming-soon notice while recurring", () => {
    render(
      <RecurringPaymentToggle isRecurring={true} setIsRecurring={vi.fn()} />,
    );
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("hides the notice when not recurring", () => {
    render(
      <RecurringPaymentToggle isRecurring={false} setIsRecurring={vi.fn()} />,
    );
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });
});
