import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Transaction } from "../../../types/domain.ts";
import { setUiVersion } from "../../../utils/uiVersion.ts";

// Record what each child receives; render a marker so the section order is observable.
const { calls, record } = vi.hoisted(() => {
  const calls: Record<string, Record<string, unknown>[]> = {};
  const record = (name: string, props: Record<string, unknown>) => {
    (calls[name] ??= []).push(props);
    return null;
  };
  return { calls, record };
});

vi.mock("../../../dashboard/statistics/StatisticsSummaryV2.tsx", () => ({
  StatisticsSummaryV2: (p: Record<string, unknown>) => (
    <div data-testid="StatisticsSummaryV2">
      {record("StatisticsSummaryV2", p)}
    </div>
  ),
}));
vi.mock("../../../dashboard/statistics/MonthByMonthChart.tsx", () => ({
  MonthByMonthChart: (p: Record<string, unknown>) => (
    <div data-testid="MonthByMonthChart">{record("MonthByMonthChart", p)}</div>
  ),
}));
vi.mock("../../../dashboard/statistics/WorthKnowingCard.tsx", () => ({
  WorthKnowingCard: (p: Record<string, unknown>) => (
    <div data-testid="WorthKnowingCard">{record("WorthKnowingCard", p)}</div>
  ),
}));
vi.mock("../../../dashboard/statistics/YearWaterfallChart.tsx", () => ({
  YearWaterfallChart: (p: Record<string, unknown>) => (
    <div data-testid="YearWaterfallChart">
      {record("YearWaterfallChart", p)}
    </div>
  ),
}));
vi.mock("../../../dashboard/statistics/FixedVsEverydayChart.tsx", () => ({
  FixedVsEverydayChart: (p: Record<string, unknown>) => (
    <div data-testid="FixedVsEverydayChart">
      {record("FixedVsEverydayChart", p)}
    </div>
  ),
}));
vi.mock("../../../dashboard/statistics/BalanceProjectionChart.tsx", () => ({
  BalanceProjectionChart: (p: Record<string, unknown>) => (
    <div data-testid="BalanceProjectionChart">
      {record("BalanceProjectionChart", p)}
    </div>
  ),
}));
vi.mock("../../../dashboard/statistics/OverviewTableV2.tsx", () => ({
  OverviewTableV2: (p: Record<string, unknown>) => (
    <div data-testid="OverviewTableV2">{record("OverviewTableV2", p)}</div>
  ),
}));

import { StatisticsV2 } from "../../../dashboard/statistics/StatisticsV2.tsx";

const tx = (date: string, type: "INCOME" | "EXPENSE", amount: number) =>
  ({
    id: `${date}-${type}`,
    name: "tx",
    tag: { name: "General", icon: "tag", colorHex: "#fff" },
    amount,
    transactionDate: `${date}T12:00:00`,
    type,
  }) as Transaction;

const transactions = [
  tx("2024-03-10", "INCOME", 1000),
  tx("2024-03-12", "EXPENSE", 200),
  tx("2025-01-05", "INCOME", 1200),
  tx("2025-02-05", "EXPENSE", 300),
];

const last = (name: string) => calls[name].at(-1)!;
const renderPage = () =>
  render(<StatisticsV2 transactions={transactions} currency="EUR" />);
// The mocks render no buttons, so the only buttons are the period selector and the Collapse.
const buttonLabels = () =>
  screen.getAllByRole("button").map((b) => b.textContent);

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  setUiVersion("v2");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 15));
});

afterEach(() => {
  vi.useRealTimers();
  setUiVersion("v1");
});

describe("StatisticsV2", () => {
  it("defaults to the current year of today", () => {
    renderPage();
    expect(last("StatisticsSummaryV2").period).toEqual({
      kind: "year",
      year: 2026,
    });
    expect(last("StatisticsSummaryV2").today).toEqual(new Date(2026, 9, 15));
    expect(last("MonthByMonthChart").byYear).toBe(false);
    expect(last("StatisticsSummaryV2").currencySymbol).toBe("€");
  });

  it("lists the years descending, including today's year, then All time", () => {
    renderPage();
    expect(buttonLabels()).toEqual([
      "2026",
      "2025",
      "2024",
      "All time",
      "Show the numbers",
    ]);
  });

  it("passes byYear and one row per year when All time is chosen", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "All time" }));

    expect(last("MonthByMonthChart").byYear).toBe(true);
    expect(last("YearWaterfallChart").byYear).toBe(true);
    expect(last("FixedVsEverydayChart").byYear).toBe(true);
    const rows = last("MonthByMonthChart").rows as {
      date: Date;
      income: number;
      expense: number;
      kept: number;
    }[];
    expect(rows.map((r) => r.date.getFullYear())).toEqual([2024, 2025]);
    expect(rows[0]).toMatchObject({ income: 1000, expense: -200, kept: 800 });
  });

  it("switches back to a single year with one row per month", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "2025" }));

    expect(last("MonthByMonthChart").byYear).toBe(false);
    expect((last("MonthByMonthChart").rows as unknown[]).length).toBe(12);
    expect(last("StatisticsSummaryV2").period).toEqual({
      kind: "year",
      year: 2025,
    });
  });

  it("renders the sections in order, with the numbers table collapsed last", () => {
    renderPage();
    const ids = [...document.querySelectorAll("[data-testid]")].map(
      (el) => (el as HTMLElement).dataset.testid,
    );
    expect(ids).toEqual([
      "StatisticsSummaryV2",
      "MonthByMonthChart",
      "WorthKnowingCard",
      "YearWaterfallChart",
      "FixedVsEverydayChart",
      "BalanceProjectionChart",
    ]);

    const toggle = screen.getByRole("button", { name: "Show the numbers" });
    const projection = screen.getByTestId("BalanceProjectionChart");
    expect(
      projection.compareDocumentPosition(toggle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps the numbers table closed until the Collapse is opened", async () => {
    renderPage();
    expect(screen.queryByTestId("OverviewTableV2")).toBeNull();
    expect(calls.OverviewTableV2).toBeUndefined();

    await userEvent.click(
      screen.getByRole("button", { name: "Show the numbers" }),
    );
    expect(screen.getByTestId("OverviewTableV2")).toBeInTheDocument();
    expect(last("OverviewTableV2").transactions).toBe(transactions);
  });

  it("shows only the header and an empty-state card for a wallet with no transactions", () => {
    render(<StatisticsV2 transactions={[]} currency="EUR" />);
    expect(
      screen.getByRole("heading", { name: "Statistics" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No statistics yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add a few transactions and your charts will show up here.",
      ),
    ).toBeInTheDocument();
    expect(buttonLabels()).toEqual(["2026", "All time"]);
    expect(
      screen.queryByRole("button", { name: "Show the numbers" }),
    ).toBeNull();
    for (const id of [
      "StatisticsSummaryV2",
      "MonthByMonthChart",
      "WorthKnowingCard",
      "YearWaterfallChart",
      "FixedVsEverydayChart",
      "BalanceProjectionChart",
      "OverviewTableV2",
    ]) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
  });

  it("feeds the balance projection the end-of-month history", () => {
    renderPage();
    const history = last("BalanceProjectionChart").history as {
      date: Date;
      balance: number;
    }[];
    expect(history[0]).toEqual({ date: new Date(2024, 2, 1), balance: 800 });
    expect(history.at(-1)!.date).toEqual(new Date(2026, 9, 1));
  });
});
