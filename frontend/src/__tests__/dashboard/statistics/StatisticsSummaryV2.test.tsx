import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";
import { StatisticsSummaryV2 } from "../../../dashboard/statistics/StatisticsSummaryV2.tsx";
import { setUiVersion } from "../../../utils/uiVersion.ts";

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

// Record what each sparkline receives; render nothing so the tests stay on props.
const { calls, record } = vi.hoisted(() => {
  const calls: Record<string, Record<string, unknown>[]> = {};
  const record = (name: string, props: Record<string, unknown>) => {
    (calls[name] ??= []).push(props);
    return null;
  };
  return { calls, record };
});

vi.mock("@/components/ui/charts", () => ({
  AreaSparkline: (p: Record<string, unknown>) => record("AreaSparkline", p),
  LineSparkline: (p: Record<string, unknown>) => record("LineSparkline", p),
}));

vi.mock("../../../dashboard/statistics/useChartPalette.ts", () => ({
  useChartPalette: () => ({
    isV2: true,
    income: "#c-income",
    expense: "#c-expense",
    balance: "#c-balance",
    warn: "#c-warn",
    danger: "#c-danger",
    subscription: "#c-sub",
    neutral: "#c-neutral",
    grid: "",
    axis: "",
  }),
}));

const tag = { name: "General", icon: "tag", colorHex: "#fff" };
const tx = (date: string, type: "INCOME" | "EXPENSE", amount: number) =>
  ({
    id: `${date}-${type}-${amount}`,
    name: "tx",
    tag,
    amount,
    transactionDate: `${date}T12:00:00`,
    type,
  }) as Transaction;

// Previous year (2025): earned 2500, spent 1000, kept 1500, savings 60%.
// 2026 (to June 15): earned 3000, spent 2000, kept 1000, savings 33%.
// Spent vs 2025: +100%.
const transactions: Transaction[] = [
  tx("2025-01-10", "INCOME", 2500),
  tx("2025-03-10", "EXPENSE", 1000),
  tx("2026-01-10", "INCOME", 1500),
  tx("2026-02-10", "INCOME", 1500),
  tx("2026-02-12", "EXPENSE", 1500),
  tx("2026-04-10", "EXPENSE", 500),
];

const today = new Date(2026, 5, 15);
const year2026 = { kind: "year", year: 2026 } as const;

describe("StatisticsSummaryV2", () => {
  beforeEach(() => {
    for (const k of Object.keys(calls)) delete calls[k];
    setUiVersion("v2");
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  it("renders the four tiles with period labels and per-month averages", async () => {
    render(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("Earned in 2026")).toBeInTheDocument();
    expect(screen.getByText("Spent in 2026")).toBeInTheDocument();
    expect(screen.getByText("Kept")).toBeInTheDocument();
    expect(screen.getByText("Savings rate")).toBeInTheDocument();
    // 3000 over 6 elapsed months.
    expect(screen.getByText("about 500 € a month")).toBeInTheDocument();
    expect(await screen.findByLabelText("+3000,00 €")).toBeInTheDocument();
    expect(await screen.findByLabelText("2000,00 €")).toBeInTheDocument();
    expect(await screen.findByLabelText("+1000,00 €")).toBeInTheDocument();
    expect(await screen.findByLabelText("33%")).toBeInTheDocument();
  });

  it("colours the spent change red when spending rose vs the previous year", () => {
    render(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    const sub = screen.getByText("vs 2025");
    expect(sub.querySelector("span")).toHaveClass("text-app-danger");
    expect(sub.querySelector("span")).toHaveTextContent("+100%");
  });

  it("colours the spent change green with a minus sign when spending fell", () => {
    const lower = [
      tx("2025-01-10", "EXPENSE", 1000),
      tx("2026-02-12", "EXPENSE", 500),
    ];
    render(
      <StatisticsSummaryV2
        transactions={lower}
        period={year2026}
        today={today}
      />,
    );
    const pct = screen.getByText("−50%");
    expect(pct).toHaveClass("text-app-income");
  });

  it("shows the previous-year kept and savings rate in the sub-lines", () => {
    render(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("+1500 €")).toHaveClass("text-app-income");
    expect(screen.getByText("2025: 60%")).toBeInTheDocument();
  });

  it("colours a negative previous-year kept red", () => {
    const losing = [
      tx("2025-01-10", "INCOME", 500),
      tx("2025-03-10", "EXPENSE", 1000),
      tx("2026-01-10", "INCOME", 1000),
    ];
    render(
      <StatisticsSummaryV2
        transactions={losing}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("−500 €")).toHaveClass("text-app-danger");
  });

  it("shows an em dash for the savings rate when nothing was earned", () => {
    render(
      <StatisticsSummaryV2
        transactions={[tx("2026-02-12", "EXPENSE", 500)]}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("uses plain labels for all time and drops the previous-year lines", () => {
    render(
      <StatisticsSummaryV2
        transactions={transactions}
        period={{ kind: "all" }}
        today={today}
        currencySymbol="$"
      />,
    );
    expect(screen.getByText("Earned")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.queryByText(/in 2026/)).toBeNull();
    expect(screen.queryByText(/All time/)).toBeNull();
    // 5500 earned over 18 months (Jan 2025 to Jun 2026).
    expect(screen.getByText("about 306 $ a month")).toBeInTheDocument();
    expect(screen.queryByText(/vs 2025/)).toBeNull();
    expect(screen.queryByText(/^2025:/)).toBeNull();
  });

  it("feeds the sparklines the per-month series with the chart colours", () => {
    render(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    const [earned, spent] = calls.AreaSparkline;
    expect(earned.data).toEqual([
      { v: 1500 },
      { v: 1500 },
      { v: 0 },
      { v: 0 },
      { v: 0 },
      { v: 0 },
    ]);
    expect(earned).toMatchObject({
      dataKey: "v",
      color: "#c-income",
      fill: "gradient",
      height: 36,
      curve: "monotone",
      interactive: false,
      ariaLabel: "Earned per month",
    });

    const kept = calls.LineSparkline.find((p) => p.color === "#c-balance")!;
    expect(kept.data).toEqual([
      { v: 1500 },
      { v: 0 },
      { v: 0 },
      { v: -500 },
      { v: 0 },
      { v: 0 },
    ]);

    const rate = calls.LineSparkline.find((p) => p.color === "#c-warn")!;
    const rates = (rate.data as { v: number }[]).map((r) => Math.round(r.v));
    expect(rates).toEqual([100, 0]);
    expect(spent.data).toEqual([
      { v: 0 },
      { v: 1500 },
      { v: 0 },
      { v: 500 },
      { v: 0 },
      { v: 0 },
    ]);
    expect(spent).toMatchObject({ color: "#c-expense", dataKey: "v" });
  });

  it("skips a sparkline whose points are all zero", () => {
    // Only spending in 2026: the earned series is all zeros, so no earned sparkline.
    render(
      <StatisticsSummaryV2
        transactions={[tx("2026-02-12", "EXPENSE", 500)]}
        period={year2026}
        today={today}
      />,
    );
    expect(calls.AreaSparkline.map((p) => p.ariaLabel)).toEqual([
      "Spent per month",
    ]);
  });

  it("skips a sparkline with fewer than two points", () => {
    render(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={new Date(2026, 0, 20)}
      />,
    );
    expect(calls.AreaSparkline ?? []).toHaveLength(0);
    expect(calls.LineSparkline ?? []).toHaveLength(0);
  });
});
