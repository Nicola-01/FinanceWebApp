import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DatePickerTrigger from "../../../components/datePicker/DatePickerTrigger";

const base = {
  isRange: false,
  isDark: true,
  preset: "custom" as const,
  currentDate: new Date(2026, 10, 15),
  setCurrentDate: vi.fn(),
  startDate: new Date(2026, 10, 15),
  endDate: null,
  onToggle: vi.fn(),
};

describe("DatePickerTrigger (single date)", () => {
  it("centres the date by default", () => {
    render(<DatePickerTrigger {...base} />);
    expect(screen.getByText("Nov 15, 2026")).toHaveClass("text-center");
  });

  it("right-aligns the date when triggerAlign is right", () => {
    render(<DatePickerTrigger {...base} triggerAlign="right" />);
    expect(screen.getByText("Nov 15, 2026")).toHaveClass("text-right");
  });
});
