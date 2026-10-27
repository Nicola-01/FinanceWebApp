import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";
import {
  useOverviewData,
  type ViewMode,
} from "../../../dashboard/statistics/useOverviewData.ts";

const tx = (
  transactionDate: string,
  type: "INCOME" | "EXPENSE",
  amount: number,
): Transaction => ({
  id: transactionDate + type,
  name: "tx",
  tag: { name: "General", icon: "tag", colorHex: "#fff" },
  amount,
  transactionDate,
  type,
});

const transactions = [
  tx("2023-06-01T12:00:00", "INCOME", 500),
  tx("2024-01-15T12:00:00", "INCOME", 1000),
  tx("2024-01-16T12:00:00", "EXPENSE", 100),
  tx("2024-03-10T12:00:00", "EXPENSE", 50),
];

const setup = (viewMode: ViewMode, txs: Transaction[] = transactions) =>
  renderHook(({ mode }) => useOverviewData(txs, mode), {
    initialProps: { mode: viewMode },
  });

describe("useOverviewData", () => {
  it("buckets the latest year by month with totals", () => {
    const { result } = setup("monthly");
    expect(result.current.selectedYear).toBe(2024);
    expect(result.current.columns).toHaveLength(12);
    expect(result.current.dataItems[0]).toEqual({ income: 1000, expense: 100 });
    expect(result.current.dataItems[2]).toEqual({ income: 0, expense: 50 });
    expect(result.current.totals).toEqual({ income: 1000, expense: 150 });
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.canGoForward).toBe(false);
  });

  it("navigates to the previous year", () => {
    const { result } = setup("monthly");
    act(() => result.current.setSelectedYear(2023));
    expect(result.current.totals).toEqual({ income: 500, expense: 0 });
    expect(result.current.canGoForward).toBe(true);
  });

  it("buckets by year in yearly mode, oldest first", () => {
    const { result } = setup("yearly");
    expect(result.current.columns.map((c) => c.label)).toEqual([
      "2023",
      "2024",
    ]);
    expect(result.current.dataItems).toEqual([
      { year: 2023, income: 500, expense: 0 },
      { year: 2024, income: 1000, expense: 150 },
    ]);
    expect(result.current.totals).toEqual({ income: 1500, expense: 150 });
  });

  it("falls back to the current year with no transactions", () => {
    const { result } = setup("monthly", []);
    expect(result.current.selectedYear).toBe(new Date().getFullYear());
    expect(result.current.totals).toEqual({ income: 0, expense: 0 });
  });
});
