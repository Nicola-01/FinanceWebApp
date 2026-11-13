import { describe, it, expect } from "vitest";
import type { Transaction } from "../../../types/domain.ts";
import {
  txYearMonth,
  availableYears,
  filterByPeriod,
  previousPeriod,
  defaultPeriod,
  periodLabel,
} from "../../../dashboard/statistics/statsPeriod.ts";

const tag = { name: "General", icon: "tag", colorHex: "#fff" };
const tx = (transactionDate: string): Transaction => ({
  id: Math.random().toString(36).slice(2),
  name: "tx",
  tag,
  amount: 10,
  transactionDate,
  type: "EXPENSE",
});

describe("txYearMonth", () => {
  it("parses the YYYY-MM prefix with a 0-based month", () => {
    expect(txYearMonth(tx("2026-03-01"))).toEqual({ year: 2026, month: 2 });
    expect(txYearMonth(tx("2026-12-31T23:59:00"))).toEqual({
      year: 2026,
      month: 11,
    });
  });
});

describe("filterByPeriod", () => {
  it("returns an empty list for no transactions", () => {
    expect(availableYears([])).toEqual([]);
    expect(filterByPeriod([], { kind: "year", year: 2026 })).toEqual([]);
    expect(filterByPeriod([], { kind: "all" })).toEqual([]);
  });

  it("puts 31 Dec 2025 and 1 Jan 2026 in the right years, including timestamps", () => {
    const txs = [tx("2025-12-31"), tx("2026-01-01"), tx("2026-01-01T00:30:00")];
    const in2025 = filterByPeriod(txs, { kind: "year", year: 2025 });
    const in2026 = filterByPeriod(txs, { kind: "year", year: 2026 });
    expect(in2025.map((t) => t.transactionDate)).toEqual(["2025-12-31"]);
    expect(in2026.map((t) => t.transactionDate)).toEqual([
      "2026-01-01",
      "2026-01-01T00:30:00",
    ]);
    expect(availableYears(txs)).toEqual([2026, 2025]);
  });

  it("returns all transactions for the all-time period", () => {
    const txs = [tx("2024-05-01"), tx("2026-01-01T00:30:00")];
    expect(filterByPeriod(txs, { kind: "all" })).toEqual(txs);
  });
});

describe("availableYears", () => {
  it("returns distinct years in descending order", () => {
    const txs = [
      tx("2024-02-01"),
      tx("2026-01-01"),
      tx("2024-11-30T10:00:00"),
      tx("2025-06-15"),
      tx("2026-07-04"),
    ];
    expect(availableYears(txs)).toEqual([2026, 2025, 2024]);
  });
});

describe("previousPeriod", () => {
  it("returns the previous calendar year", () => {
    expect(previousPeriod({ kind: "year", year: 2026 })).toEqual({
      kind: "year",
      year: 2025,
    });
  });

  it("returns null for all time", () => {
    expect(previousPeriod({ kind: "all" })).toBeNull();
  });
});

describe("defaultPeriod", () => {
  it("is the current year of the given date", () => {
    expect(defaultPeriod(new Date(2026, 10, 13))).toEqual({
      kind: "year",
      year: 2026,
    });
  });
});

describe("periodLabel", () => {
  it("labels a year by its number and all time as 'All time'", () => {
    expect(periodLabel({ kind: "year", year: 2026 })).toBe("2026");
    expect(periodLabel({ kind: "all" })).toBe("All time");
  });
});
