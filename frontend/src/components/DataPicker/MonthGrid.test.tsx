import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MonthGrid from "./MonthGrid";
import type { MonthGridProps } from "./MonthGrid";

const baseProps = (): MonthGridProps => ({
  monthDate: new Date(2026, 0, 15),
  startDate: null,
  endDate: null,
  setStartDate: vi.fn(),
  setEndDate: vi.fn(),
  preset: "month",
  setPreset: vi.fn(),
  isRange: true,
  color: "rgb(1, 2, 3)",
  isDark: false,
  weekStartsOn: 1,
});

describe("MonthGrid", () => {
  it("renders the days of the current month", () => {
    render(<MonthGrid {...baseProps()} />);
    // Spot-check mid-month days that are unique to January (boundary days like
    // 1 and 31 also appear as leading/trailing adjacent-month cells).
    ["5", "15", "25"].forEach((d) =>
      expect(screen.getByText(d)).toBeInTheDocument(),
    );
  });

  it("switches to 'custom' and sets the start date on a first day click", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<MonthGrid {...props} />);

    await user.click(screen.getByText("15"));

    expect(props.setPreset).toHaveBeenCalledWith("custom");
    const startArg = (props.setStartDate as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Date;
    expect(startArg.getDate()).toBe(15);
    expect(startArg.getMonth()).toBe(0);
    expect(props.setEndDate).toHaveBeenCalledWith(null);
  });

  it("sets the end date on a later click while in custom range mode", async () => {
    const user = userEvent.setup();
    const props: MonthGridProps = {
      ...baseProps(),
      preset: "custom",
      startDate: new Date(2026, 0, 10),
      endDate: null,
    };
    render(<MonthGrid {...props} />);

    await user.click(screen.getByText("20"));

    const endArg = (props.setEndDate as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Date;
    expect(endArg.getDate()).toBe(20);
    // Preset stays 'custom' — it must not be reset on the second click.
    expect(props.setPreset).not.toHaveBeenCalled();
  });

  it("does nothing when disableDaySelection is set", async () => {
    const user = userEvent.setup();
    const props: MonthGridProps = { ...baseProps(), disableDaySelection: true };
    render(<MonthGrid {...props} />);

    await user.click(screen.getByText("15"));

    expect(props.setStartDate).not.toHaveBeenCalled();
    expect(props.setEndDate).not.toHaveBeenCalled();
    expect(props.setPreset).not.toHaveBeenCalled();
  });
});
