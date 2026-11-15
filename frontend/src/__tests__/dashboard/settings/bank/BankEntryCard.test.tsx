import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createContext } from "react";
import type { Transaction, Wallet } from "../../../../types/domain";
import { setUiVersion } from "../../../../utils/uiVersion";

const { ctxRef, bank } = vi.hoisted(() => ({
  ctxRef: {
    current: {} as {
      wallet: Wallet;
      toCategorise: Transaction[];
      fetchData: ReturnType<typeof vi.fn>;
    },
  },
  bank: { getWalletBank: vi.fn(), listBankRules: vi.fn() },
}));
vi.mock("../../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctxRef.current,
  WalletContext: createContext(null),
}));
vi.mock("../../../../api/bankApi", () => bank);
vi.mock("../../../../dashboard/settings/ConnectBankForm.tsx", () => ({
  ConnectBankForm: () => null,
}));
vi.mock("../../../../dashboard/settings/BankRuleEditor.tsx", () => ({
  BankRuleEditor: () => null,
}));

import { BankEntryCard } from "../../../../dashboard/settings/bank/BankEntryCard";

const wallet = {
  id: "w1",
  name: "Main",
  color: "#8b5cf6",
  currency: "EUR",
  userRole: "OWNER",
} as Wallet;
const connection = {
  id: "c1",
  walletId: "w1",
  aspspName: "Revolut",
  status: "ACTIVE",
  accounts: [
    {
      id: "a1",
      displayName: "Main",
      lastSyncedAt: new Date(Date.now() - 14 * 60_000).toISOString(),
      importedCount: 0,
    },
    { id: "a2", displayName: "Savings", importedCount: 0 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  setUiVersion("v2");
  ctxRef.current = {
    wallet,
    toCategorise: [{ id: "t1" } as Transaction, { id: "t2" } as Transaction],
    fetchData: vi.fn(),
  };
  bank.getWalletBank.mockResolvedValue({
    enabled: true,
    connections: [connection],
  });
  bank.listBankRules.mockResolvedValue([
    {
      id: "r1",
      name: "Netflix",
      matchText: "NETFLIX",
      usedBy: [],
      transactionCount: 0,
    },
  ]);
});

afterEach(() => setUiVersion("v1"));

describe("BankEntryCard", () => {
  it("summarises accounts, sync time, rules and pending imports", async () => {
    render(<BankEntryCard />);
    const card = await screen.findByRole("button", { name: /^Bank/ });
    expect(card).toHaveTextContent("2 accounts · synced 14 min ago · 1 rule");
    expect(screen.getByText("2 to categorise")).toHaveClass("text-app-warn");
  });

  it("leaves out the pending part when nothing is to categorise", async () => {
    ctxRef.current = { ...ctxRef.current, toCategorise: [] };
    render(<BankEntryCard />);
    const card = await screen.findByRole("button", { name: /^Bank/ });
    expect(card).not.toHaveTextContent("to categorise");
  });

  it("renders nothing while loading or when Open Banking is off", async () => {
    bank.getWalletBank.mockResolvedValue({ enabled: false, connections: [] });
    const { container } = render(<BankEntryCard />);
    await waitFor(() => expect(bank.getWalletBank).toHaveBeenCalledWith("w1"));
    expect(container).toBeEmptyDOMElement();
    expect(bank.listBankRules).not.toHaveBeenCalled();
  });

  it("opens the Bank overlay with accounts and rules", async () => {
    render(<BankEntryCard />);
    await userEvent.click(await screen.findByRole("button", { name: /^Bank/ }));
    const dialog = await screen.findByRole("dialog", { name: "Bank" });
    expect(dialog).toHaveTextContent("Accounts");
    expect(dialog).toHaveTextContent("Netflix");
  });
});
