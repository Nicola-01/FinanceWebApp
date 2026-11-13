import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Subscription, Transaction } from "../../../types/domain";
import { setUiVersion } from "../../../utils/uiVersion";

const ctx = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx.value,
}));
vi.mock("../../../dashboard/transaction/TransactionsTable.tsx", () => ({
  TransactionsTable: () => <div>table</div>,
}));

import { TransactionsTab } from "../../../dashboard/transaction/TransactionsTab";

const dueSoon = {
  id: "s1",
  name: "Netflix",
  amount: 12.99,
  type: "EXPENSE",
  status: "ACTIVE",
  tag: { name: "Film", icon: "film", colorHex: "#ff5a5a" },
  nextExecutionDate: new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() + 2,
  ).toISOString(),
} as Subscription;

const setup = (onlyToCategorise: boolean) => {
  ctx.value = {
    wallet: { color: "#8b5cf6", currency: "EUR" },
    isLoading: false,
    tags: [],
    fetchData: vi.fn(),
    filteredTransactions: [] as Transaction[],
    pendingTransactions: [],
    toCategorise: [],
    onlyToCategorise,
    subscriptions: [dueSoon],
  };
  render(<TransactionsTab />);
};

describe("TransactionsTab coming-up column", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("shows the column under v2", () => {
    setup(false);
    expect(screen.getByText("Coming up")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("hides the column in to-categorise review mode", () => {
    setup(true);
    expect(screen.queryByText("Coming up")).toBeNull();
  });

  it("does not render the column under v1", () => {
    setUiVersion("v1");
    setup(false);
    expect(screen.queryByText("Coming up")).toBeNull();
  });
});
