import React, { lazy, Suspense } from "react";
import { TransactionsTab } from "../transaction/TransactionsTab";
import { SubscriptionTab } from "../subscription/SubscriptionTab";
import type { Wallet } from "../../types/domain";
import { Icon } from "../../components/icon/Icon.tsx";
import { WalletTabs } from "./WalletTabs.tsx";
import { TagsTab } from "../tag/TagsTab.tsx";
import { SettingsTab } from "../settings/SettingsTab.tsx";
import { WalletProvider } from "./WalletProvider.tsx";
import { useWalletContext } from "./WalletContext.tsx";
import { TransactionsFilter } from "../transaction/TransactionsFilter.tsx";
import { TransactionsHero } from "../transaction/TransactionsHero.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";
import { walletVars } from "../../utils/color";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies";

interface WalletDashboardProps {
  _wallet: Wallet;
  onWalletDelete: () => void;
  onWalletUpdate: () => void;
  /** v2 desktop: sync / bell / profile, right of the wallet title. */
  headerActions?: React.ReactNode;
}

// Code-split: these tabs pull in the chart kit (keeps the main chunk under the PWA precache limit).
const StatisticsTab = lazy(() =>
  import("../statistics/StatisticsTab").then((m) => ({
    default: m.StatisticsTab,
  })),
);
const BudgetTab = lazy(() =>
  import("../budget/BudgetTab").then((m) => ({ default: m.BudgetTab })),
);

/** v2 (D13): wallet title row, tabs under it, the hero card on Transactions only. */
const WalletHeaderV2: React.FC<{ actions?: React.ReactNode }> = ({
  actions,
}) => {
  const { wallet, activeTab } = useWalletContext();
  const currencyName =
    CURRENCY_META[wallet.currency as CurrencyCode]?.name ?? wallet.currency;

  return (
    <>
      {/* Own stacking context above the sticky tabs (z-90) and toolbar (z-80), so the profile/bell/sync dropdowns open over them. */}
      <div className="relative z-[91] mb-3.5 hidden items-center justify-between gap-4 lg:flex">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 font-display text-[28px] leading-[1.1] font-bold tracking-[-0.02em]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-wallet text-base text-on-wallet">
              <Icon icon={wallet.icon} />
            </span>
            <span className="truncate">{wallet.name}</span>
          </h1>
          <div className="mt-0.5 text-[13px] text-app-muted">
            {currencyName}
          </div>
        </div>
        {actions}
      </div>

      <WalletTabs />

      {activeTab === "transactions" && <TransactionsHero />}

      {(activeTab === "transactions" || activeTab === "category") && (
        <TransactionsFilter />
      )}
    </>
  );
};

/** v2 wallet root: the wallet colour becomes the subtree's accent (`bg-wallet`, CTAs, tab icons). */
const WalletRootV2: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { wallet } = useWalletContext();
  return <div style={walletVars(wallet.color)}>{children}</div>;
};

const WalletHeader: React.FC = () => {
  const { wallet, activeTab } = useWalletContext();

  return (
    <>
      <div className="px-4 lg:px-8 pt-4 lg:pt-8 flex-col shrink-0 items-center justify-between mb-2 md:mb-4">
        <h1 className="text-3xl flex items-center gap-3 font-bold text-app-text mb-1">
          <Icon icon={wallet.icon} color={wallet.color} />
          {wallet.name}
        </h1>
        <span className="text-xs font-bold px-2 py-1 bg-app-input rounded-md text-app-muted uppercase">
          Currency: {wallet.currency}
        </span>
      </div>

      <WalletTabs />

      {(activeTab === "transactions" || activeTab === "category") && (
        <TransactionsFilter />
      )}
    </>
  );
};

const WalletBody: React.FC<{ bare?: boolean }> = ({ bare = false }) => {
  const { activeTab } = useWalletContext();

  return (
    <div
      className={
        // ui-v2-switch: v2 pads at the page level (`bare`).
        bare
          ? "relative flex w-full flex-1 flex-col"
          : "flex flex-col flex-1 min-h-full w-full max-w-350 mx-auto relative px-2 sm:px-4 lg:px-8 pb-4 lg:pb-8"
      }
    >
      {activeTab === "transactions" && <TransactionsTab />}
      {activeTab === "subscription" && <SubscriptionTab />}
      {activeTab === "category" && <TagsTab />}
      <Suspense
        fallback={
          <div className="h-[400px] bg-app-card rounded-[var(--r-card)] animate-pulse" />
        }
      >
        {activeTab === "statistics" && <StatisticsTab />}
        {activeTab === "budget" && <BudgetTab />}
      </Suspense>
      {activeTab === "settings" && <SettingsTab />}
    </div>
  );
};

export const WalletDashboard: React.FC<WalletDashboardProps> = ({
  _wallet,
  onWalletDelete,
  onWalletUpdate,
  headerActions,
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch
  if (ui === "v2") {
    return (
      <WalletProvider
        _wallet={_wallet}
        onWalletDelete={onWalletDelete}
        onWalletUpdate={onWalletUpdate}
      >
        <WalletRootV2>
          <WalletHeaderV2 actions={headerActions} />
          <WalletBody bare />
        </WalletRootV2>
      </WalletProvider>
    );
  }
  return (
    <WalletProvider
      _wallet={_wallet}
      onWalletDelete={onWalletDelete}
      onWalletUpdate={onWalletUpdate}
    >
      <WalletHeader />
      <WalletBody />
    </WalletProvider>
  );
};
