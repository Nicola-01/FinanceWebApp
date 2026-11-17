import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";

// Capture the dataset the shared monthly chart shell hands to the chart provider.
const { calls, investTags } = vi.hoisted(() => ({
  calls: [] as { dataset: Record<string, unknown>[] }[],
  investTags: { current: new Set<string>() },
}));

vi.mock("../../../dashboard/wallet/useInvestmentTags.ts", () => ({
  useInvestmentTags: () => investTags.current,
}));
vi.mock("../../../utils/ThemeContext.tsx", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("../../../dashboard/statistics/useChartPalette.ts", () => ({
  useChartPalette: () => ({
    isV2: false,
    income: "#c-income",
    expense: "#c-expense",
    balance: "#c-balance",
    grid: "",
    axis: "",
  }),
}));
const { nullComponent } = vi.hoisted(() => ({ nullComponent: () => null }));
vi.mock("@mui/x-charts-pro/ChartDataProviderPro", () => ({
  ChartDataProviderPro: (p: {
    dataset: Record<string, unknown>[];
    children?: React.ReactNode;
  }) => {
    calls.push({ dataset: p.dataset });
    return <div>{p.children}</div>;
  },
}));
vi.mock("@mui/x-charts-pro/ChartsSurface", () => ({
  ChartsSurface: nullComponent,
}));
vi.mock("@mui/x-charts-pro/ChartsXAxis", () => ({
  ChartsXAxis: nullComponent,
}));
vi.mock("@mui/x-charts-pro/ChartsYAxis", () => ({
  ChartsYAxis: nullComponent,
}));
vi.mock("@mui/x-charts-pro/ChartsTooltip", () => ({
  ChartsTooltip: nullComponent,
}));
vi.mock("@mui/x-charts-pro/ChartsGrid", () => ({ ChartsGrid: nullComponent }));
vi.mock("@mui/x-charts-pro/ChartZoomSlider", () => ({
  ChartZoomSlider: nullComponent,
}));
vi.mock("@mui/x-charts-pro/ChartsClipPath", () => ({
  ChartsClipPath: nullComponent,
}));
vi.mock("@mui/x-charts/ChartsAxisHighlight", () => ({
  ChartsAxisHighlight: nullComponent,
}));

import { MonthlySnapshotChart } from "../../../dashboard/statistics/MonthlySnapshotChart.tsx";
import { CumulativeChart } from "../../../dashboard/statistics/CumulativeChart.tsx";

const stocks = { name: "Stocks", icon: "tag", colorHex: "#fff" };
const tx = (
  transactionDate: string,
  type: "INCOME" | "EXPENSE",
  amount: number,
  tag?: Transaction["tag"],
): Transaction =>
  ({
    id: `${transactionDate}-${type}-${amount}`,
    name: "tx",
    tag: tag ?? { name: "General", icon: "tag", colorHex: "#fff" },
    amount,
    type,
    transactionDate,
  }) as Transaction;

const transactions = [
  tx("2026-01-10T12:00:00", "INCOME", 1000),
  tx("2026-01-11T12:00:00", "EXPENSE", 100),
  tx("2026-01-12T12:00:00", "EXPENSE", 700, stocks),
  tx("2026-02-10T12:00:00", "INCOME", 200, stocks),
];

const lastDataset = () => calls.at(-1)!.dataset;

describe("monthly statistics charts with investment tags", () => {
  beforeEach(() => {
    calls.length = 0;
    investTags.current = new Set(["Stocks"]);
  });

  it("the snapshot chart leaves investment tags out of income, expense and balance", () => {
    render(<MonthlySnapshotChart transactions={transactions} />);
    // February holds only an investment cash-out, so it gets no month at all.
    expect(lastDataset()).toEqual([
      { label: "Jan 2026", income: 1000, expense: 100, balance: 900 },
    ]);
  });

  it("the cumulative chart leaves investment tags out of the running totals", () => {
    render(<CumulativeChart transactions={transactions} />);
    expect(lastDataset()).toEqual([
      { label: "Jan 2026", income: 1000, expense: 100, balance: 900 },
    ]);
  });
});
