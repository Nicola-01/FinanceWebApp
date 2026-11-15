import { useEffect } from "react";
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

// The picker is mocked: it records its props and exposes buttons that emit the
// range/preset changes a user would make ("pick 2025" and "pick all").
vi.mock("../../../components/datePicker/CustomDatePicker.tsx", () => ({
  default: (p: Record<string, unknown>) => {
    const onChange = p.onChange as (v: unknown) => void;
    const onPresetChange = p.onPresetChange as (v: string) => void;
    // Like the real picker: re-emits the preset whenever the callback changes (every render).
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      onPresetChange(p.initialPreset as string);
    }, [onPresetChange, p.initialPreset]);
    return (
      <div data-testid="CustomDatePicker">
        {record("CustomDatePicker", p)}
        <button
          onClick={() =>
            onChange({
              start: new Date(2025, 0, 1),
              end: new Date(2025, 11, 31),
            })
          }
        >
          pick 2025
        </button>
        <button
          onClick={() => {
            onChange({ start: null, end: null });
            onPresetChange("all");
          }}
        >
          pick all
        </button>
      </div>
    );
  },
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

const WALLET_ID = "wallet-1";
const last = (name: string) => calls[name].at(-1)!;
const renderPage = () =>
  render(
    <StatisticsV2
      transactions={transactions}
      currency="EUR"
      walletId={WALLET_ID}
      accentColor="#123456"
    />,
  );
// The mocked picker's two buttons and the Collapse are the only buttons on the page.
// The view selector is a v2 tab (SegmentedControl).
const buttonLabels = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('button, [role="tab"]'),
  ).map((b) => b.textContent);

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  localStorage.clear();
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

  it("gives the picker only whole years and All, opened on the current year", () => {
    renderPage();
    expect(last("CustomDatePicker")).toMatchObject({
      isRange: true,
      color: "#123456",
      allowedPresets: ["year", "all"],
      initialPreset: "year",
    });
    expect(last("CustomDatePicker").initialStartDate).toEqual(
      new Date(2026, 0, 1),
    );
    expect(last("CustomDatePicker").initialEndDate).toEqual(
      new Date(2026, 11, 31),
    );
    expect(buttonLabels()).toEqual([
      "pick 2025",
      "pick all",
      "Show the numbers",
    ]);
  });

  it("passes byYear and one row per year when All is picked", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "pick all" }));

    expect(last("StatisticsSummaryV2").period).toEqual({ kind: "all" });
    expect(last("MonthByMonthChart").byYear).toBe(true);
    expect(last("YearWaterfallChart").byYear).toBe(true);
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
    await userEvent.click(screen.getByRole("button", { name: "pick 2025" }));

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
      "CustomDatePicker",
      "StatisticsSummaryV2",
      "MonthByMonthChart",
      "WorthKnowingCard",
      "YearWaterfallChart",
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

  it("renders the layout controls under the grid with editing off and nothing hidden", () => {
    const renderLayoutControls = vi.fn(() => <p>layout controls</p>);
    render(
      <StatisticsV2
        transactions={transactions}
        currency="EUR"
        walletId={WALLET_ID}
        accentColor="#123456"
        renderLayoutControls={renderLayoutControls}
      />,
    );
    expect(screen.getByText("layout controls")).toBeInTheDocument();
    expect(renderLayoutControls).toHaveBeenLastCalledWith(
      expect.objectContaining({ editing: false, hiddenCount: 0 }),
    );
  });

  it("does not render the layout controls for a wallet with no transactions", () => {
    const renderLayoutControls = vi.fn(() => <p>layout controls</p>);
    render(
      <StatisticsV2
        transactions={[]}
        currency="EUR"
        walletId={WALLET_ID}
        accentColor="#123456"
        renderLayoutControls={renderLayoutControls}
      />,
    );
    expect(renderLayoutControls).not.toHaveBeenCalled();
  });

  it("shows only the header and an empty-state card for a wallet with no transactions", () => {
    render(
      <StatisticsV2
        transactions={[]}
        currency="EUR"
        walletId={WALLET_ID}
        accentColor="#123456"
      />,
    );
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
    expect(buttonLabels()).toEqual(["pick 2025", "pick all"]);
    expect(
      screen.queryByRole("button", { name: "Show the numbers" }),
    ).toBeNull();
    for (const id of [
      "StatisticsSummaryV2",
      "MonthByMonthChart",
      "WorthKnowingCard",
      "YearWaterfallChart",
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
