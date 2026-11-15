import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Transaction, Wallet } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const modal = vi.hoisted(() => ({ openModal: vi.fn() }));
const ctx = vi.hoisted(() => ({ transactions: [] as unknown[] }));

vi.mock(
  "../../../dashboard/wallet/WalletContext.tsx",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../../dashboard/wallet/WalletContext.tsx")
    >()),
    useWalletContext: () => ({ transactions: ctx.transactions }),
  }),
);
vi.mock("../../../dashboard/transaction/ToCategoriseActions.tsx", () => ({
  ToCategoriseActions: () => null,
}));
vi.mock("../../../dashboard/transaction/PendingTransactionsPanel.tsx", () => ({
  PendingTransactionsPanel: () => null,
}));
vi.mock("../../../dashboard/transaction/useTransactionDeepLink.ts", () => ({
  useTransactionDeepLink: () => undefined,
}));
vi.mock("../../../components/ui/FloatingActionButton.tsx", () => ({
  FloatingActionButton: () => null,
}));
vi.mock("../../../modals/transaction/TransactionDetailsModal.tsx", () => ({
  TransactionDetailsModal: () => null,
}));
vi.mock("../../../modals/transaction/TransactionModal.tsx", async () => {
  const React = await import("react");
  return {
    TransactionModal: React.forwardRef(
      (_props: unknown, ref: React.Ref<unknown>) => {
        React.useImperativeHandle(ref, () => ({ openModal: modal.openModal }));
        return null;
      },
    ),
  };
});
vi.mock("../../../api/walletOps", () => ({
  deleteTransaction: vi.fn(),
}));

import { TransactionsTable } from "../../../dashboard/transaction/TransactionsTable";

const wallet = { id: "w1", currency: "EUR", userRole: "EDITOR" } as Wallet;

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: "1",
  name: "Shop",
  tag: { name: "Food", icon: "bank", colorHex: "#9ca3af" },
  amount: 10,
  originalAmount: 10,
  originalCurrency: "EUR",
  type: "EXPENSE",
  transactionDate: "2026-06-27",
  ...overrides,
});

const renderTable = (
  transactions: Transaction[],
  { isLoading = false, pending = [] as Transaction[] } = {},
) =>
  render(
    <TransactionsTable
      wallet={wallet}
      tags={[]}
      transactions={transactions}
      pendingTransactions={pending}
      onRefresh={vi.fn()}
      isLoading={isLoading}
    />,
  );

describe("TransactionsTable (v2)", () => {
  beforeEach(() => {
    setUiVersion("v2");
    ctx.transactions = [];
    modal.openModal.mockClear();
  });
  afterEach(() => setUiVersion("v1"));

  it("shows the net total of each day in its header", () => {
    renderTable([
      tx({ id: "a", type: "INCOME", amount: 100 }),
      tx({ id: "b", type: "EXPENSE", amount: 30.5 }),
    ]);
    expect(screen.getByText(/^\+69,50/)).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("empty state has no add button (the floating action button is the only one)", () => {
    renderTable([]);
    expect(
      screen.getByText("No transactions in this period"),
    ).toBeInTheDocument();
    // The FAB is mocked to null in this file, so the empty state must have no button at all
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a surface skeleton while loading", () => {
    const { container } = renderTable([], { isLoading: true });
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
    expect(screen.queryByText("No transactions in this period")).toBeNull();
  });
});

describe("TransactionsTable loading fallback (v1)", () => {
  beforeEach(() => {
    setUiVersion("v1");
    ctx.transactions = [];
  });

  it("shows the hand-rolled skeleton instead of real rows while loading", () => {
    const { container } = renderTable([tx({ id: "a", name: "Shop" })], {
      isLoading: true,
    });
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("Shop")).toBeNull();
  });
});
