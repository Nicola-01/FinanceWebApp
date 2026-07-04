import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { startOfMonth } from "date-fns";
import DayCell from "../../../components/DataPicker/DayCell";
import type { DayCellProps } from "../../../components/DataPicker/DayCell";

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
