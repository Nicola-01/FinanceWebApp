import { afterEach, describe, expect, it, vi } from "vitest";
import { dailyNetSeries, periodLabel, sumByType } from "../../utils/period";
import type { Transaction } from "../../types/domain";

const oct = {
  start: new Date(2026, 9, 1),
  end: new Date(2026, 9, 31, 23, 59, 59, 999),
};

describe("periodLabel", () => {
  it("names months and years", () => {
    expect(periodLabel(oct, "month")).toBe("October 2026");
    expect(periodLabel(oct, "year")).toBe("2026");
    expect(periodLabel(oct, "all")).toBe("");
  });
});

describe("sumByType", () => {
  it("sums income and expense separately", () => {
    const tx = (type: "INCOME" | "EXPENSE", amount: number) =>
      ({ type, amount }) as Transaction;
    expect(
      sumByType([tx("INCOME", 100), tx("EXPENSE", 30), tx("EXPENSE", 2.5)]),
    ).toEqual({
      income: 100,
      expense: 32.5,
    });
    expect(sumByType([])).toEqual({ income: 0, expense: 0 });
  });
});

describe("dailyNetSeries", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const tx = (
    type: "INCOME" | "EXPENSE",
    amount: number,
    transactionDate: string,
  ) => ({ type, amount, transactionDate }) as Transaction;

  it("accumulates income and expense day by day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
    const rows = dailyNetSeries(
      [
        tx("INCOME", 100, "2026-03-01"),
        tx("EXPENSE", 30, "2026-03-03"),
        tx("EXPENSE", 20, "2026-03-03"),
      ],
      new Date(2026, 2, 1),
      new Date(2026, 2, 5),
    );
    expect(rows.map((r) => r.v)).toEqual([100, 100, 50, 50, 50]);
    expect(rows[0].date).toEqual(new Date(2026, 2, 1));
  });

  it("does not draw days after today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
    const rows = dailyNetSeries(
      [tx("INCOME", 10, "2026-03-02")],
      new Date(2026, 2, 1),
      new Date(2026, 2, 31),
    );
    expect(rows).toHaveLength(10);
    expect(rows[9].date).toEqual(new Date(2026, 2, 10));
  });

  it("starts at the earliest transaction when there is no start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
    const rows = dailyNetSeries(
      [tx("EXPENSE", 5, "2026-03-02"), tx("INCOME", 8, "2026-03-03")],
      null,
      new Date(2026, 2, 4),
    );
    expect(rows.map((r) => r.v)).toEqual([-5, 3, 3]);
  });

  it("returns [] when there are no bounds and no transactions", () => {
    expect(dailyNetSeries([], null, null)).toEqual([]);
  });

  it("returns [] when the start is after the clamped end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
    expect(
      dailyNetSeries([], new Date(2026, 2, 20), new Date(2026, 2, 31)),
    ).toEqual([]);
  });
});
