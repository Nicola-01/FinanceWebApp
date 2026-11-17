import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";

vi.mock("../../../dashboard/wallet/useInvestmentTags.ts", () => ({
  useInvestmentTags: () => new Set(["PAC"]),
}));

import { InvestmentsWidget } from "../../../dashboard/statistics/InvestmentsWidget.tsx";

const tx = (
  type: "INCOME" | "EXPENSE",
  amount: number,
  tagName: string,
): Transaction => ({
  id: `${type}-${tagName}-${amount}`,
  name: "tx",
  tag: { name: tagName, icon: "tag", colorHex: "#123456" },
  amount,
  transactionDate: "2026-01-10T12:00:00",
  type,
});

describe("InvestmentsWidget", () => {
  it("renders nothing when the period has no investment transactions", () => {
    const { container } = render(
      <InvestmentsWidget
        transactions={[tx("EXPENSE", 50, "Food")]}
        period={{ kind: "year", year: 2026 }}
        currencySymbol="€"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the title, the facts row and the per-tag breakdown", () => {
    render(
      <InvestmentsWidget
        transactions={[tx("EXPENSE", 400, "PAC"), tx("INCOME", 100, "PAC")]}
        period={{ kind: "year", year: 2026 }}
        currencySymbol="€"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Investments" }),
    ).toBeInTheDocument();
    expect(screen.getByText("bought")).toBeInTheDocument();
    expect(screen.getByText("cashed out")).toBeInTheDocument();
    expect(screen.getByText("invested net")).toBeInTheDocument();
    expect(screen.getByText("PAC")).toBeInTheDocument();
  });
});
