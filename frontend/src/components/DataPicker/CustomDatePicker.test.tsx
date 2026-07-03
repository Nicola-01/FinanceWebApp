import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { subDays, isSameDay } from "date-fns";
import CustomDatePicker from "./CustomDatePicker";
import type { CustomDatePickerProps, DateRangeValue } from "./CustomDatePicker";
import { ThemeContext } from "../../utils/ThemeContext";
import type { ThemeContextType } from "../../utils/ThemeContext";

// The component calls useTheme() unconditionally, so a ThemeContext provider
// is required even when the `isDark` prop is supplied.
const themeValue: ThemeContextType = {
  theme: "light",
  setTheme: vi.fn(),
  resolvedTheme: "light",
};

const renderPicker = (props: Partial<CustomDatePickerProps> = {}) =>
  render(
    <ThemeContext.Provider value={themeValue}>
      <CustomDatePicker {...props} />
    </ThemeContext.Provider>,
  );

// Deterministic reference month used across the interaction tests.
const JAN_15 = new Date(2026, 0, 15);

const expectDate = (
  value: Date | null | undefined,
  year: number,
  month: number,
  day: number,
) => {
  expect(value).toBeInstanceOf(Date);
  const d = value as Date;
  expect(d.getFullYear()).toBe(year);
  expect(d.getMonth()).toBe(month);
  expect(d.getDate()).toBe(day);
};

const lastRangeValue = (onChange: ReturnType<typeof vi.fn>): DateRangeValue =>
  onChange.mock.calls.at(-1)![0] as DateRangeValue;

describe("CustomDatePicker", () => {
  it("renders the trigger with the current month label (range + month preset)", () => {
    renderPicker({ initialStartDate: JAN_15 });
    expect(screen.getByText("January 2026")).toBeInTheDocument();
  });

  it("opens the calendar popover when the trigger is clicked", async () => {
    const user = userEvent.setup();
    renderPicker({ initialStartDate: JAN_15 });

    // Closed: no day cells and no preset sidebar are rendered.
    expect(screen.queryByText("15")).not.toBeInTheDocument();
    expect(screen.queryByText("Year")).not.toBeInTheDocument();

    await user.click(screen.getByText("January 2026"));

    // Open: day cells and the preset sidebar are now visible.
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  it("selecting two days in range mode fires onChange with start and end", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ onChange, initialStartDate: JAN_15 });

    await user.click(screen.getByText("January 2026")); // open
    await user.click(screen.getByText("15")); // start
    await user.click(screen.getByText("20")); // end

    const value = lastRangeValue(onChange);
    expectDate(value.start, 2026, 0, 15);
    expectDate(value.end, 2026, 0, 20);
  });

  it("clicking a single day switches the active preset to 'custom'", async () => {
    const user = userEvent.setup();
    const onPresetChange = vi.fn();
    renderPicker({ onPresetChange, initialStartDate: JAN_15 });

    await user.click(screen.getByText("January 2026")); // open
    await user.click(screen.getByText("15"));

    expect(onPresetChange).toHaveBeenLastCalledWith("custom");
  });

  it("navigates months via the trigger chevrons", async () => {
    const user = userEvent.setup();
    renderPicker({ initialStartDate: JAN_15 });

    // While closed the only buttons are the trigger's prev/next chevrons.
    const [prev, next] = screen.getAllByRole("button");

    await user.click(next);
    expect(screen.getByText("February 2026")).toBeInTheDocument();

    await user.click(prev);
    await user.click(prev);
    expect(screen.getByText("December 2025")).toBeInTheDocument();
  });

  it("navigates years via the trigger chevrons in year preset", async () => {
    const user = userEvent.setup();
    renderPicker({ initialPreset: "year", initialStartDate: JAN_15 });

    expect(screen.getByText("2026")).toBeInTheDocument();
    const [, next] = screen.getAllByRole("button");

    await user.click(next);
    expect(screen.getByText("2027")).toBeInTheDocument();
  });

  it("the 'Year' preset emits the full-year range", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ onChange, initialStartDate: JAN_15 });

    await user.click(screen.getByText("January 2026")); // open
    await user.click(screen.getByText("Year"));

    const value = lastRangeValue(onChange);
    expectDate(value.start, 2026, 0, 1);
    expectDate(value.end, 2026, 11, 31);
  });

  it("the 'All' preset emits a null range and shows 'All transactions'", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ onChange, initialStartDate: JAN_15 });

    await user.click(screen.getByText("January 2026")); // open
    await user.click(screen.getByText("All"));

    const value = lastRangeValue(onChange);
    expect(value.start).toBeNull();
    expect(value.end).toBeNull();
    expect(screen.getByText("All transactions")).toBeInTheDocument();
  });

  it("the 'Last 30 Days' preset ends today and starts 30 days earlier", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ onChange, initialStartDate: JAN_15 });

    await user.click(screen.getByText("January 2026")); // open
    await user.click(screen.getByText("Last 30 Days"));

    const value = lastRangeValue(onChange);
    const now = new Date();
    expect(isSameDay(value.end as Date, now)).toBe(true);
    expect(isSameDay(value.start as Date, subDays(now, 30))).toBe(true);
  });

  it("the 'Today' preset emits today as start and a null end", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ onChange, initialStartDate: JAN_15 });

    await user.click(screen.getByText("January 2026")); // open
    await user.click(screen.getByText("Today"));

    const value = lastRangeValue(onChange);
    expect(isSameDay(value.start as Date, new Date())).toBe(true);
    expect(value.end).toBeNull();
  });

  it("single-date mode shows 'Select a date' when nothing is chosen", () => {
    // initialPreset 'custom' keeps startDate null (month preset would expand it).
    renderPicker({
      isRange: false,
      initialPreset: "custom",
      initialStartDate: null,
    });
    expect(screen.getByText("Select a date")).toBeInTheDocument();
  });

  it("single-date mode emits a Date and auto-closes on day click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({
      isRange: false,
      initialPreset: "custom",
      initialStartDate: JAN_15,
      onChange,
    });

    await user.click(screen.getByText("Jan 15, 2026")); // open
    await user.click(screen.getByText("20"));

    // Single-date mode passes a bare Date (not a range object).
    const value = onChange.mock.calls.at(-1)![0] as Date;
    expectDate(value, 2026, 0, 20);

    // The picker auto-closes: the calendar day cells are gone.
    expect(screen.queryByText("20")).not.toBeInTheDocument();
  });

  it("hides the preset sidebar when hideSidebar is set", async () => {
    const user = userEvent.setup();
    renderPicker({ initialStartDate: JAN_15, hideSidebar: true });

    await user.click(screen.getByText("January 2026")); // open

    // Calendar is open (day visible) but preset buttons are absent.
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.queryByText("Year")).not.toBeInTheDocument();
    expect(screen.queryByText("Last 30 Days")).not.toBeInTheDocument();
  });
});
