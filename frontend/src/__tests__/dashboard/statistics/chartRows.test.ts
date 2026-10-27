import { describe, it, expect } from "vitest";
import {
  toCumulativeRows,
  toSnapshotRows,
  type MonthlyBucket,
} from "../../../dashboard/statistics/chartData";
import {
  formatBalance,
  formatExpense,
  formatIncome,
  tooltipSx,
} from "../../../dashboard/statistics/chartTheme.ts";

const buckets: MonthlyBucket[] = [
  { date: new Date(2023, 11, 1), income: 100, expense: 40 },
  { date: new Date(2024, 0, 1), income: 0, expense: 90 },
];

describe("toSnapshotRows", () => {
  it("labels each month and computes the per-month balance", () => {
    expect(toSnapshotRows(buckets)).toEqual([
      { label: "Dec 2023", income: 100, expense: 40, balance: 60 },
      { label: "Jan 2024", income: 0, expense: 90, balance: -90 },
    ]);
  });

  it("returns an empty array for no buckets", () => {
    expect(toSnapshotRows([])).toEqual([]);
  });
});

describe("toCumulativeRows", () => {
  it("accumulates income, expense and balance from the first month", () => {
    expect(toCumulativeRows(buckets)).toEqual([
      { label: "Dec 2023", income: 100, expense: 40, balance: 60 },
      { label: "Jan 2024", income: 100, expense: 130, balance: -30 },
    ]);
  });
});

describe("chart value formatters", () => {
  it("formats with fixed sign conventions and blanks nulls", () => {
    expect(formatIncome(12.5)).toBe("+12.50");
    expect(formatExpense(3)).toBe("-3.00");
    expect(formatBalance(4)).toBe("+4.00");
    expect(formatBalance(-4)).toBe("-4.00");
    expect(formatIncome(null)).toBe("");
    expect(formatExpense(null)).toBe("");
    expect(formatBalance(null)).toBe("");
  });

  it("switches the tooltip border with the theme", () => {
    expect(tooltipSx(true)["& .MuiChartsTooltip-paper"].border).toBe(
      "1px solid #ffffff20",
    );
    expect(tooltipSx(false)["& .MuiChartsTooltip-paper"].border).toBe(
      "1px solid #00000010",
    );
  });
});
