import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletDashboard } from "../../../dashboard/wallet/WalletDashboard";
import { setUiVersion } from "../../../utils/uiVersion";

const ctx = vi.hoisted(() => ({ activeTab: "statistics" as string }));

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ({
    wallet: { name: "Main", currency: "EUR", icon: "wallet", color: "#8b5cf6" },
    activeTab: ctx.activeTab,
    isLoading: false,
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
// Loaders never resolve, so the lazy tab stays suspended and its fallback is what renders.
vi.mock("../../../dashboard/wallet/tabLoaders.ts", () => ({
  loadStatisticsTab: () => new Promise(() => {}),
  loadBudgetTab: () => new Promise(() => {}),
  loadTagsTab: () => new Promise(() => {}),
  loadSettingsTab: () => new Promise(() => {}),
  usePrefetchTabs: () => undefined,
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
    />,
  );

describe("WalletDashboard lazy-tab fallback", () => {
  afterEach(() => {
    setUiVersion("v1");
    localStorage.clear();
  });

  it.each([
    ["statistics", "Loading statistics"],
    ["budget", "Loading budgets"],
    ["category", "Loading categories"],
    ["settings", "Loading settings"],
  ])("v2 %s shows its own skeleton", (tab, label) => {
    setUiVersion("v2");
    ctx.activeTab = tab;
    renderDashboard();
    expect(screen.getByRole("status", { name: label })).toBeInTheDocument();
  });

  it("v1 keeps the generic 400px placeholder with no status region", () => {
    setUiVersion("v1");
    ctx.activeTab = "settings";
    const { container } = renderDashboard();
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.querySelector(".h-\\[400px\\]")).not.toBeNull();
  });
});
