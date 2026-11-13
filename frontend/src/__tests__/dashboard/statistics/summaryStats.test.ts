import { describe, it, expect } from "vitest";
import type { Transaction } from "../../../types/domain.ts";
import {
  summarize,
  summarizePeriod,
} from "../../../dashboard/statistics/summaryStats.ts";
import { MONTH_LABELS } from "../../../utils/months.ts";

const tag = { name: "General", icon: "tag", colorHex: "#fff" };
const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  name: "tx",
  tag,
  amount: 0,
  transactionDate: "2024-01-15T12:00:00",
  type: "EXPENSE",
  ...over,
});

describe("summarize", () => {
  it("totals income and expense and averages over active months", () => {
    const result = summarize([
      tx({
        type: "INCOME",
        amount: 1000,
        transactionDate: "2024-01-10T12:00:00",
      }),
      tx({
        type: "EXPENSE",
        amount: 300,
        transactionDate: "2024-01-11T12:00:00",
      }),
      tx({
        type: "INCOME",
        amount: 500,
        transactionDate: "2024-03-10T12:00:00",
      }),
    ]);
    expect(result).toEqual({
      income: 1500,
      expense: 300,
      net: 1200,
      avgIncome: 750,
      avgExpense: 150,
      avgNet: 600,
    });
  });

  it("returns zeros without transactions", () => {
    expect(summarize([])).toEqual({
      income: 0,
      expense: 0,
      net: 0,
      avgIncome: 0,
      avgExpense: 0,
      avgNet: 0,
    });
  });
});

describe("summarizePeriod", () => {
  const nulls = (n: number) => Array<null>(n).fill(null);

  it("current year: slots after today are null and the savings rate is per month", () => {
    const today = new Date(2026, 2, 15); // March
    const result = summarizePeriod(
      [
        tx({ type: "INCOME", amount: 1000, transactionDate: "2026-01-10" }),
        tx({ type: "INCOME", amount: 500, transactionDate: "2026-02-10" }),
        tx({ type: "EXPENSE", amount: 300, transactionDate: "2026-02-11" }),
        tx({ type: "EXPENSE", amount: 200, transactionDate: "2026-03-01" }),
      ],
      { kind: "year", year: 2026 },
      today,
    );
    expect(result.series.labels).toEqual(MONTH_LABELS);
    expect(result.series.earned).toEqual([1000, 500, 0, ...nulls(9)]);
    expect(result.series.spent).toEqual([0, 300, 200, ...nulls(9)]);
    expect(result.series.kept).toEqual([1000, 200, -200, ...nulls(9)]);
    expect(result.series.rate).toEqual([1, 0.4, null, ...nulls(9)]);
    expect(result.earned).toBe(1500);
    expect(result.spent).toBe(500);
    expect(result.kept).toBe(1000);
    expect(result.savingsRate).toBeCloseTo(1000 / 1500);
    expect(result.months).toBe(3);
    expect(result.avgEarnedPerMonth).toBeCloseTo(500);
  });

  it("past year: all 12 slots are numbers and months is 12", () => {
    const today = new Date(2026, 10, 13);
    const result = summarizePeriod(
      [
        tx({ type: "INCOME", amount: 100, transactionDate: "2025-02-10" }),
        tx({ type: "EXPENSE", amount: 40, transactionDate: "2025-12-01" }),
      ],
      { kind: "year", year: 2025 },
      today,
    );
    expect(result.series.earned).toEqual([
      0,
      100,
      ...Array<number>(10).fill(0),
    ]);
    expect(result.series.spent).toEqual([...Array<number>(11).fill(0), 40]);
    expect(result.series.kept[11]).toBe(-40);
    expect(result.series.rate).toEqual([null, 1, ...nulls(10)]);
    expect(result.months).toBe(12);
    expect(result.avgEarnedPerMonth).toBeCloseTo(100 / 12);
  });

  it("future year: all slots null and no elapsed months", () => {
    const result = summarizePeriod(
      [],
      { kind: "year", year: 2027 },
      new Date(2026, 10, 13),
    );
    expect(result.series.earned).toEqual(nulls(12));
    expect(result.series.rate).toEqual(nulls(12));
    expect(result.months).toBe(0);
    expect(result.avgEarnedPerMonth).toBe(0);
  });

  it("all time: one slot per year from oldest to newest, gap years are 0", () => {
    const today = new Date(2026, 10, 13);
    const result = summarizePeriod(
      [
        tx({ type: "INCOME", amount: 100, transactionDate: "2022-05-10" }),
        tx({ type: "EXPENSE", amount: 30, transactionDate: "2024-06-10" }),
        tx({ type: "INCOME", amount: 50, transactionDate: "2026-02-10" }),
      ],
      { kind: "all" },
      today,
    );
    expect(result.series.labels).toEqual([
      "2022",
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
    expect(result.series.earned).toEqual([100, 0, 0, 0, 50]);
    expect(result.series.spent).toEqual([0, 0, 30, 0, 0]);
    expect(result.series.kept).toEqual([100, 0, -30, 0, 50]);
    expect(result.series.rate).toEqual([1, null, null, null, 1]);
    // 2022-05 through 2026-11 inclusive
    expect(result.months).toBe(55);
    expect(result.avgEarnedPerMonth).toBeCloseTo(150 / 55);
    expect(result.vsPrevious).toBeNull();
  });

  it("savings rate is null when nothing was earned", () => {
    const result = summarizePeriod(
      [tx({ type: "EXPENSE", amount: 100, transactionDate: "2026-03-01" })],
      { kind: "year", year: 2026 },
      new Date(2026, 10, 13),
    );
    expect(result.earned).toBe(0);
    expect(result.savingsRate).toBeNull();
    expect(result.kept).toBe(-100);
    expect(result.avgEarnedPerMonth).toBe(0);
  });

  it("vsPrevious compares same months only (December of the previous year is ignored in October)", () => {
    const today = new Date(2026, 9, 15); // October
    const result = summarizePeriod(
      [
        tx({ type: "INCOME", amount: 1000, transactionDate: "2025-03-10" }),
        tx({ type: "EXPENSE", amount: 400, transactionDate: "2025-05-10" }),
        tx({ type: "EXPENSE", amount: 900, transactionDate: "2025-12-10" }),
        tx({ type: "INCOME", amount: 800, transactionDate: "2026-04-10" }),
        tx({ type: "EXPENSE", amount: 500, transactionDate: "2026-04-11" }),
      ],
      { kind: "year", year: 2026 },
      today,
    );
    expect(result.vsPrevious).toEqual({
      label: "2025",
      spentPct: 0.25,
      kept: 600,
      savingsRate: 0.6,
    });
  });

  it("vsPrevious is null without previous-year data in range, and spentPct is null when prev spent is 0", () => {
    const today = new Date(2026, 9, 15);
    const none = summarizePeriod(
      [tx({ type: "EXPENSE", amount: 5, transactionDate: "2026-01-05" })],
      { kind: "year", year: 2026 },
      today,
    );
    expect(none.vsPrevious).toBeNull();

    const onlyDecember = summarizePeriod(
      [tx({ type: "EXPENSE", amount: 5, transactionDate: "2025-12-05" })],
      { kind: "year", year: 2026 },
      today,
    );
    expect(onlyDecember.vsPrevious).toBeNull();

    const incomeOnly = summarizePeriod(
      [tx({ type: "INCOME", amount: 5, transactionDate: "2025-01-05" })],
      { kind: "year", year: 2026 },
      today,
    );
    expect(incomeOnly.vsPrevious).toEqual({
      label: "2025",
      spentPct: null,
      kept: 5,
      savingsRate: 1,
    });
  });

  it("months for the current year is today's month count", () => {
    const result = summarizePeriod(
      [],
      { kind: "year", year: 2026 },
      new Date(2026, 10, 13),
    );
    expect(result.months).toBe(11);
  });

  it("empty input yields zeros, empty all-time series and no comparison", () => {
    const today = new Date(2026, 10, 13);
    expect(summarizePeriod([], { kind: "all" }, today)).toEqual({
      earned: 0,
      spent: 0,
      kept: 0,
      savingsRate: null,
      months: 0,
      avgEarnedPerMonth: 0,
      series: { labels: [], earned: [], spent: [], kept: [], rate: [] },
      vsPrevious: null,
    });
  });
});
