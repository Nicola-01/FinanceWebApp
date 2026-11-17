import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";
import { StatisticsSummary } from "../../../dashboard/statistics/StatisticsSummary.tsx";
import { formatAmount } from "../../../utils/format.ts";

const { investTags } = vi.hoisted(() => ({
  investTags: { current: new Set<string>() },
}));
vi.mock("../../../dashboard/wallet/useInvestmentTags.ts", () => ({
  useInvestmentTags: () => investTags.current,
}));

const tx = (
  type: "INCOME" | "EXPENSE",
  amount: number,
  tagName: string,
): Transaction => ({
  id: `${type}-${amount}-${tagName}`,
  name: "tx",
  tag: { name: tagName, icon: "tag", colorHex: "#fff" },
  amount,
  type,
  transactionDate: "2024-01-15T12:00:00",
});

describe("StatisticsSummary (v1)", () => {
  const transactions = [
    tx("INCOME", 1000, "Salary"),
    tx("EXPENSE", 300, "Food"),
    tx("EXPENSE", 500, "Stocks"),
  ];

  it("leaves investment tags out of the income, expense and net totals", () => {
    investTags.current = new Set(["Stocks"]);
    render(<StatisticsSummary transactions={transactions} />);
    expect(screen.getAllByText(`-${formatAmount(300)}`).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(`-${formatAmount(800)}`)).toBeNull();
    expect(screen.getAllByText(`+${formatAmount(700)}`).length).toBeGreaterThan(
      0,
    );
    investTags.current = new Set();
  });
});
