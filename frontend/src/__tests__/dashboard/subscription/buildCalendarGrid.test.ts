import { describe, it, expect } from "vitest";
import { buildCalendarGrid } from "../../../dashboard/subscription/buildCalendarGrid";

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

describe("buildCalendarGrid", () => {
  it("builds 42 consecutive days starting on Monday", () => {
    // March 2026 starts on a Sunday → grid starts Mon 23 Feb.
    const g = buildCalendarGrid(new Date(2026, 2, 15), 1);
    expect(g.calendarDays).toHaveLength(42);
    expect(ymd(g.calendarDays[0])).toEqual([2026, 2, 23]);
    expect(ymd(g.calendarDays[41])).toEqual([2026, 4, 5]);
    expect(ymd(g.monthStart)).toEqual([2026, 3, 1]);
    expect(ymd(g.monthEnd)).toEqual([2026, 3, 31]);
    expect(g.weekDays).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
  });

  it("pads a 4-row month (Feb 2021, Mon start) to 6 rows", () => {
    const g = buildCalendarGrid(new Date(2021, 1, 10), 1);
    expect(g.calendarDays).toHaveLength(42);
    expect(ymd(g.calendarDays[0])).toEqual([2021, 2, 1]);
    expect(ymd(g.calendarDays[41])).toEqual([2021, 3, 14]);
  });

  it("supports a Sunday week start", () => {
    const g = buildCalendarGrid(new Date(2026, 2, 15), 0);
    expect(ymd(g.calendarDays[0])).toEqual([2026, 3, 1]);
    expect(g.weekDays[0]).toBe("Sun");
  });
});
