import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";
import { setUiVersion } from "../../../utils/uiVersion.ts";

const { v2Calls } = vi.hoisted(() => ({
  v2Calls: [] as { transactions: Transaction[]; currency: string }[],
}));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx,
}));
vi.mock("../../../utils/ThemeContext", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("../../../dashboard/statistics/StatisticsV2.tsx", () => ({
  StatisticsV2: (props: { transactions: Transaction[]; currency: string }) => {
    v2Calls.push(props);
    return <div data-testid="v2-page" />;
  },
}));
vi.mock("../../../dashboard/statistics/StatisticsSummary.tsx", () => ({
  StatisticsSummary: () => <div data-testid="v1-summary" />,
}));
vi.mock("../../../dashboard/statistics/OverviewTable.tsx", () => ({
  OverviewTable: () => <div data-testid="v1-overview" />,
}));
vi.mock("../../../dashboard/statistics/MonthlySnapshotChart.tsx", () => ({
  MonthlySnapshotChart: () => <div data-testid="v1-snapshot" />,
}));
vi.mock("../../../dashboard/statistics/CumulativeChart.tsx", () => ({
  CumulativeChart: () => <div data-testid="v1-cumulative" />,
}));
vi.mock("../../../components/ui/SwitchableCard.tsx", () => ({
  SwitchableCard: (props: { title: string; children: React.ReactNode }) => (
    <div data-testid="switchable">
      <h3>{props.title}</h3>
      {props.children}
    </div>
  ),
}));

import { StatisticsTab } from "../../../dashboard/statistics/StatisticsTab.tsx";

const tag = { name: "General", icon: "tag", colorHex: "#fff" };
const tx = (over: Partial<Transaction>): Transaction =>
  ({
    id: Math.random().toString(36).slice(2),
    name: "tx",
    tag,
    amount: 10,
    transactionDate: "2025-03-10T12:00:00",
    type: "EXPENSE",
    needsReview: false,
    ...over,
  }) as Transaction;

const categorised = tx({ id: "ok" });
const toReview = tx({ id: "bank", needsReview: true });

const ctx = {
  transactions: [categorised, toReview],
  wallet: { id: "w1", name: "Main", currency: "EUR" },
};

beforeEach(() => {
  v2Calls.length = 0;
});

afterEach(() => {
  setUiVersion("v1");
});

describe("StatisticsTab", () => {
  it("renders the v1 summary, table and switchable chart by default", () => {
    render(<StatisticsTab />);
    expect(screen.getByTestId("v1-summary")).toBeInTheDocument();
    expect(screen.getByTestId("v1-overview")).toBeInTheDocument();
    expect(screen.getByTestId("switchable")).toBeInTheDocument();
    expect(screen.getByTestId("v1-snapshot")).toBeInTheDocument();
    expect(screen.queryByTestId("v2-page")).toBeNull();
    expect(v2Calls).toHaveLength(0);
  });

  it("renders StatisticsV2 with only categorised transactions and the wallet currency in v2", () => {
    setUiVersion("v2");
    render(<StatisticsTab />);
    expect(screen.getByTestId("v2-page")).toBeInTheDocument();
    expect(screen.queryByTestId("v1-summary")).toBeNull();
    expect(screen.queryByTestId("switchable")).toBeNull();

    // The tab's zoom-init effect re-renders once, so check the latest call.
    expect(v2Calls.at(-1)!.transactions).toEqual([categorised]);
    expect(v2Calls.at(-1)!.currency).toBe("EUR");
  });
});
