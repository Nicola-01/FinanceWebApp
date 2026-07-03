import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MonthSelector from "../../../components/DataPicker/MonthSelector";
import type { MonthSelectorProps } from "../../../components/DataPicker/MonthSelector";

// The month labels derive from `new Date()`; pin it mid-month so no month
// rolls over (avoids ambiguous/duplicate abbreviations) and use fireEvent to
// stay independent of timers.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 15));
});
afterEach(() => {
  vi.useRealTimers();
});

const baseProps = (): MonthSelectorProps => ({
  currentDate: new Date(2026, 3, 1), // April
  onSelectMonth: vi.fn(),
  onYearClick: vi.fn(),
  onPrevYear: vi.fn(),
  onNextYear: vi.fn(),
  direction: "next",
  color: "rgb(1, 2, 3)",
  isDark: false,
});

describe("MonthSelector", () => {
  it("renders all twelve month abbreviations and the current year", () => {
    render(<MonthSelector {...baseProps()} />);
    ["Jan", "Apr", "Dec"].forEach((m) =>
      expect(screen.getByText(m)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: "2026" })).toBeInTheDocument();
  });

  it("fires onSelectMonth with the picked month", () => {
    const props = baseProps();
    render(<MonthSelector {...props} />);

    fireEvent.click(screen.getByText("Mar"));

    const arg = (props.onSelectMonth as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Date;
    expect(arg.getMonth()).toBe(2);
  });

  it("highlights the currently selected month with the accent colour", () => {
    render(<MonthSelector {...baseProps()} />);
    expect(screen.getByText("Apr")).toHaveStyle({
      backgroundColor: "rgb(1, 2, 3)",
    });
    expect(screen.getByText("Jan")).not.toHaveStyle({
      backgroundColor: "rgb(1, 2, 3)",
    });
  });

  it("fires the year navigation callbacks", () => {
    const props = baseProps();
    render(<MonthSelector {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "2026" }));
    expect(props.onYearClick).toHaveBeenCalledTimes(1);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]); // prev-year chevron
    expect(props.onPrevYear).toHaveBeenCalledTimes(1);
    fireEvent.click(buttons[2]); // next-year chevron
    expect(props.onNextYear).toHaveBeenCalledTimes(1);
  });
});
