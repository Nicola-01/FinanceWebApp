import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletDashboard } from "../../../dashboard/wallet/WalletDashboard";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: { name: "Main", currency: "EUR", icon: "wallet", color: "#8b5cf6" },
    activeTab: "transactions",
  }),
}));
vi.mock("../../../dashboard/wallet/WalletProvider.tsx", () => ({
  WalletProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock("../../../dashboard/wallet/WalletTabs.tsx", () => ({
  WalletTabs: () => null,
}));
vi.mock("../../../dashboard/transaction/TransactionsFilter.tsx", () => ({
  TransactionsFilter: () => null,
}));
vi.mock("../../../dashboard/transaction/TransactionsHero.tsx", () => ({
  TransactionsHero: () => null,
}));
vi.mock("../../../dashboard/transaction/TransactionsTab", () => ({
  TransactionsTab: () => null,
}));

const wallet = {
  id: "w1",
  name: "Main",
  currency: "EUR",
  icon: "wallet",
  color: "#8b5cf6",
} as never;

const renderDashboard = () =>
  render(
    <WalletDashboard
      _wallet={wallet}
      onWalletDelete={vi.fn()}
      onWalletUpdate={vi.fn()}
      headerActions={<span data-testid="header-actions" />}
    />,
  );

describe("WalletDashboard header actions stacking", () => {
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it("v2 title row lifts the header actions above the sticky tabs and toolbar", () => {
    setUiVersion("v2");
    renderDashboard();
    const titleRow = screen.getByTestId("header-actions").parentElement;
    expect(titleRow).toHaveClass("relative", "z-[91]");
  });

  it("v1 renders no v2 title row", () => {
    setUiVersion("v1");
    renderDashboard();
    expect(screen.queryByTestId("header-actions")).toBeNull();
  });
});
