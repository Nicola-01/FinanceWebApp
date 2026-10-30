import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain";

const ctx = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx.value,
}));
vi.mock("../../../dashboard/transaction/TransactionsTable.tsx", () => ({
  TransactionsTable: ({ transactions }: { transactions: Transaction[] }) => (
    <ul>
      {transactions.map((t) => (
        <li key={t.id}>{t.name}</li>
      ))}
    </ul>
  ),
}));

import { TransactionsTab } from "../../../dashboard/transaction/TransactionsTab";

const tx = (id: string, needsReview = false) =>
  ({
    id,
    name: `Tx ${id}`,
    needsReview,
    transactionDate: "2026-01-01",
  }) as Transaction;

const setup = (
  filtered: Transaction[],
  toCategorise: Transaction[],
  onlyToCategorise: boolean,
) => {
  ctx.value = {
    wallet: { color: "#8b5cf6" },
    isLoading: false,
    tags: [],
    fetchData: vi.fn(),
    filteredTransactions: filtered,
    pendingTransactions: [],
    toCategorise,
    onlyToCategorise,
  };
  render(<TransactionsTab />);
};

describe("TransactionsTab", () => {
  it("lists the filtered transactions by default", () => {
    setup([tx("1")], [tx("2", true)], false);
    expect(screen.getByText("Tx 1")).toBeInTheDocument();
    expect(screen.queryByText("Tx 2")).toBeNull();
  });

  it("lists only the to-categorise rows in review mode", () => {
    setup([tx("1")], [tx("2", true)], true);
    expect(screen.getByText("Tx 2")).toBeInTheDocument();
    expect(screen.queryByText("Tx 1")).toBeNull();
  });
});
