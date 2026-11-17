import { describe, it, expect } from "vitest";
import { investmentsSeries } from "../../../dashboard/statistics/investmentsData.ts";
import type { Transaction } from "../../../types/domain.ts";

const tx = (
  type: "INCOME" | "EXPENSE",
  amount: number,
  tagName: string,
  transactionDate: string,
): Transaction => ({
  id: `${type}-${tagName}-${transactionDate}-${amount}`,
  name: "tx",
  tag: { name: tagName, icon: "tag", colorHex: "#123456" },
  amount,
  transactionDate,
  type,
});

const invest = new Set(["PAC", "ETF"]);
const today = new Date(2026, 2, 15); // March 2026

describe("investmentsSeries", () => {
  // Three months of 2026 plus noise: a food expense and a 2025 purchase.
  const txs = [
    tx("EXPENSE", 300, "PAC", "2026-01-10T12:00:00"),
    tx("EXPENSE", 200, "ETF", "2026-02-05T12:00:00"),
    tx("INCOME", 100, "ETF", "2026-02-20T12:00:00"),
    tx("EXPENSE", 500, "PAC", "2026-03-01T12:00:00"),
    tx("EXPENSE", 50, "Food", "2026-03-02T12:00:00"),
    tx("EXPENSE", 999, "PAC", "2025-06-01T12:00:00"),
  ];

  it("builds monthly bought/cashed-out with a running total up to today", () => {
    const series = investmentsSeries(
      txs,
      { kind: "year", year: 2026 },
      today,
      invest,
    );
    expect(series.months.map((m) => m.bought)).toEqual([300, 200, 500]);
    expect(series.months.map((m) => m.cashedOut)).toEqual([0, 100, 0]);
    expect(series.months.map((m) => m.cumulative)).toEqual([300, 400, 900]);
    expect(series.months[0].date).toEqual(new Date(2026, 0, 1));
  });

  it("sorts the per-tag net largest first and totals the period", () => {
    const series = investmentsSeries(
      txs,
      { kind: "year", year: 2026 },
      today,
      invest,
    );
    expect(series.byTag).toEqual([
      { name: "PAC", net: 800 },
      { name: "ETF", net: 100 },
    ]);
    expect(series.bought).toBe(1000);
    expect(series.cashedOut).toBe(100);
    expect(series.net).toBe(900);
  });

  it("returns empty totals when the period has no investment transactions", () => {
    const series = investmentsSeries(
      [tx("EXPENSE", 50, "Food", "2026-01-02T12:00:00")],
      { kind: "year", year: 2026 },
      today,
      invest,
    );
    expect(series.byTag).toEqual([]);
    expect(series.bought).toBe(0);
    expect(series.net).toBe(0);
  });
});
