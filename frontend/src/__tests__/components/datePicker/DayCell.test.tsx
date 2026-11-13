import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { startOfMonth } from "date-fns";
import DayCell from "../../../components/datePicker/DayCell";
import type { DayCellProps } from "../../../components/datePicker/DayCell";
import { setUiVersion } from "../../../utils/uiVersion";

const baseProps = (): DayCellProps => ({
  day: new Date(2026, 0, 15),
  monthStart: startOfMonth(new Date(2026, 0, 15)),
  startDate: null,
  endDate: null,
  onClick: vi.fn(),
  isRange: true,
  preset: "custom",
  color: "rgb(1, 2, 3)",
  isDark: false,
});

describe("DayCell", () => {
  it("fires onClick when a current-month day is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<DayCell {...props} />);

    await user.click(screen.getByText("15"));

    expect(props.onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick for a day outside the current month", async () => {
    const user = userEvent.setup();
    const props: DayCellProps = {
      ...baseProps(),
      day: new Date(2026, 0, 31),
      // monthStart points at February, so Jan 31 is an out-of-month day.
      monthStart: startOfMonth(new Date(2026, 1, 1)),
    };
    render(<DayCell {...props} />);

    await user.click(screen.getByText("31"));

    expect(props.onClick).not.toHaveBeenCalled();
  });

  it("renders the selected indicator when the day is the start date", () => {
    const props: DayCellProps = {
      ...baseProps(),
      startDate: new Date(2026, 0, 15),
    };
    const { container } = render(<DayCell {...props} />);

    // The filled selection pill is only rendered for a selected day.
    expect(container.querySelector(".inset-2")).not.toBeNull();
  });

  it("suppresses selection styling when disableDaySelection is set", () => {
    const props: DayCellProps = {
      ...baseProps(),
      startDate: new Date(2026, 0, 15),
      disableDaySelection: true,
    };
    const { container } = render(<DayCell {...props} />);

    expect(container.querySelector(".inset-2")).toBeNull();
  });
});

describe("DayCell (UI v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  // The day number's parent is the cell that carries the v2 fill classes.
  const cellOf = (text: string) => screen.getByText(text).parentElement!;

  it("paints a selected start day with the wallet fill and no inline style", () => {
    const props: DayCellProps = {
      ...baseProps(),
      startDate: new Date(2026, 0, 15),
    };
    render(<DayCell {...props} />);

    const cell = cellOf("15");
    expect(cell).toHaveClass(
      "bg-wallet",
      "text-on-wallet",
      "rounded-[var(--r-sm)]",
    );
    expect(cell.style.backgroundColor).toBe("");
    // The v1 accent pill is not rendered in v2.
    expect(document.querySelector(".inset-2")).toBeNull();
  });

  it("tints days between start and end with the wallet colour mix", () => {
    const props: DayCellProps = {
      ...baseProps(),
      day: new Date(2026, 0, 17),
      startDate: new Date(2026, 0, 15),
      endDate: new Date(2026, 0, 20),
    };
    render(<DayCell {...props} />);

    const cell = cellOf("17");
    expect(cell).toHaveClass(
      "bg-[color-mix(in_srgb,var(--wallet)_16%,transparent)]",
    );
    expect(cell).not.toHaveClass("bg-wallet");
  });

  it("marks today with a semibold weight and a hairline ring", () => {
    const today = new Date();
    const props: DayCellProps = {
      ...baseProps(),
      day: today,
      monthStart: startOfMonth(today),
    };
    render(<DayCell {...props} />);

    const cell = cellOf(String(today.getDate()));
    expect(cell).toHaveClass("font-semibold", "ring-1", "ring-app-border");
  });

  it("keeps the v2 click handler on current-month days", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    render(<DayCell {...props} />);

    await user.click(screen.getByText("15"));

    expect(props.onClick).toHaveBeenCalledTimes(1);
  });
});
