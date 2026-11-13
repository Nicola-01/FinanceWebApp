import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain";

const ctx = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx.value,
}));

import { TransactionsHero } from "../../../dashboard/transaction/TransactionsHero";

const tx = (
  id: string,
  type: "INCOME" | "EXPENSE",
  amount: number,
  extra: Partial<Transaction> = {},
) =>
  ({
    id,
    name: `Tx ${id}`,
    type,
    amount,
    needsReview: false,
    amountPending: false,
    tag: { name: "Food" },
    transactionDate: "2026-03-10",
    ...extra,
  }) as unknown as Transaction;

const setup = (transactions: Transaction[], datePreset: string) => {
  ctx.value = {
    wallet: { color: "#8b5cf6", currency: "EUR" },
    transactions,
    tags: [{ name: "Food" }],
    dateRange: {
      start: new Date(2026, 2, 1),
      end: new Date(2026, 2, 31),
    },
    datePreset,
  };
  render(<TransactionsHero />);
};

const march = [
  tx("1", "INCOME", 1000),
  tx("2", "EXPENSE", 250.5),
  tx("3", "EXPENSE", 149.5),
  tx("4", "INCOME", 100, { transactionDate: "2026-02-01" }),
  tx("5", "EXPENSE", 999, { amountPending: true }),
];

describe("TransactionsHero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders net, income and spent totals for the period, ignoring pending rows", () => {
    setup(march, "month");
    // Net = 1000 - 400 = +600 (the pending expense and the out-of-period row are ignored).
    expect(screen.getByText("+600,00 €")).toBeInTheDocument();
    expect(screen.getByText("Net in March 2026")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("+1000,00 €")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.getByText("400,00 €")).toBeInTheDocument();
    expect(screen.getByText("1 transaction")).toBeInTheDocument();
  });

  it("shows the spent share of income when there is income", () => {
    setup(march, "month");
    expect(screen.getByText("40% of income")).toBeInTheDocument();
  });

  it("has no period switcher; the toolbar date picker owns the period", () => {
    setup(march, "month");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("uses the generic label for the all preset", () => {
    setup(march, "all");
    expect(screen.getByText("Net in this period")).toBeInTheDocument();
  });

  it("shows 'Nothing yet' when there are neither incomes nor expenses", () => {
    setup([], "all");
    expect(screen.getAllByText("Nothing yet")).toHaveLength(2);
    expect(screen.queryByText(/% of income/)).toBeNull();
  });

  it("shows the expense count when there is no income", () => {
    setup([tx("1", "EXPENSE", 20)], "all");
    expect(screen.getByText("1 transaction")).toBeInTheDocument();
    expect(screen.queryByText(/% of income/)).toBeNull();
  });
});
