import React, { lazy, Suspense } from "react";
import { TransactionsTab } from "../transaction/TransactionsTab";
import { SubscriptionTab } from "../subscription/SubscriptionTab";
import type { Wallet } from "../../types/domain";
import { Icon } from "../../components/icon/Icon.tsx";
import { WalletTabs } from "./WalletTabs.tsx";
import { WalletProvider } from "./WalletProvider.tsx";
import { useWalletContext } from "./WalletContext.tsx";
import { TransactionsFilter } from "../transaction/TransactionsFilter.tsx";
import { TransactionsHero } from "../transaction/TransactionsHero.tsx";
import { useUiVersion } from "../../hooks/useUiVersion";
import { walletVars } from "../../utils/color";
import { BankRuleDraftHost } from "../settings/BankRuleDraftHost.tsx";
import {
  loadBudgetTab,
  loadSettingsTab,
  loadStatisticsTab,
  loadTagsTab,
  usePrefetchTabs,
} from "./tabLoaders.ts";
import {
  BudgetTabSkeletonV2,
  SettingsTabSkeletonV2,
  StatisticsTabSkeletonV2,
  TagsTabSkeletonV2,
} from "./TabSkeletonsV2.tsx";
import type { TabType } from "./walletTabs.ts";

interface WalletDashboardProps {
  _wallet: Wallet;
  onWalletDelete: () => void;
  onWalletUpdate: () => void;
  /** v2 desktop: sync / bell / profile, right of the wallet title. */
  headerActions?: React.ReactNode;
}

// Code-split: these tabs pull in the chart kit (keeps the main chunk under the PWA precache limit).
// Loaders live in tabLoaders.ts so the idle prefetch warms the same chunks.
const StatisticsTab = lazy(loadStatisticsTab);
const BudgetTab = lazy(loadBudgetTab);
const TagsTab = lazy(loadTagsTab);
const SettingsTab = lazy(loadSettingsTab);

/** v2 per-tab loading fallbacks, each shaped like its real tab. */
const V2_TAB_SKELETONS: Partial<Record<TabType, React.FC>> = {
  statistics: StatisticsTabSkeletonV2,
  budget: BudgetTabSkeletonV2,
  category: TagsTabSkeletonV2,
  settings: SettingsTabSkeletonV2,
};

/** Mounts inside WalletProvider: warms the lazy tab chunks once wallet data has loaded. */
const TabPrefetch: React.FC = () => {
  const { isLoading } = useWalletContext();
  usePrefetchTabs(!isLoading);
  return null;
};

/** v2 (D13): wallet title row, tabs under it, the hero card on Transactions only. */
const WalletHeaderV2: React.FC<{ actions?: React.ReactNode }> = ({
  actions,
}) => {
  const { wallet, activeTab } = useWalletContext();

  return (
    <>
      {/* Own stacking context above the sticky tabs (z-90) and toolbar (z-80), so the profile/bell/sync dropdowns open over them. */}
      <div className="relative z-[91] mb-6 hidden items-center justify-between gap-4 lg:flex">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 font-display text-[28px] leading-[1.1] font-bold tracking-[-0.02em]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-wallet text-base text-on-wallet">
              <Icon icon={wallet.icon} />
            </span>
            <span className="truncate">{wallet.name}</span>
          </h1>
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
  const [ui] = useUiVersion();
  const V2Skeleton = ui === "v2" ? V2_TAB_SKELETONS[activeTab] : undefined;

  const content = (
    <>
      {activeTab === "transactions" && <TransactionsTab />}
      {activeTab === "subscription" && <SubscriptionTab />}
      <Suspense
        fallback={
          // ui-v2-switch: v2 shows the active tab's own skeleton
          V2Skeleton ? (
            <V2Skeleton />
          ) : (
            <div className="h-[400px] bg-app-card rounded-[var(--r-card)] animate-pulse" />
          )
        }
      >
        {activeTab === "statistics" && <StatisticsTab />}
        {activeTab === "budget" && <BudgetTab />}
        {activeTab === "category" && <TagsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </Suspense>
    </>
  );

  return (
    <div
      className={
        // ui-v2-switch: v2 pads at the page level (`bare`).
        bare
          ? "relative flex w-full flex-1 flex-col"
          : "flex flex-col flex-1 min-h-full w-full max-w-350 mx-auto relative px-2 sm:px-4 lg:px-8 pb-4 lg:pb-8"
      }
    >
      {/* ui-v2-switch: opacity-only fade per tab; no transform, so the fixed FAB stays fixed. */}
      {bare ? (
        <div
          key={activeTab}
          className="flex flex-1 flex-col motion-safe:animate-[fadeIn_0.25s_ease-out]"
        >
          {content}
        </div>
      ) : (
        content
      )}
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
          <TabPrefetch />
          <WalletHeaderV2 actions={headerActions} />
          <WalletBody bare />
          <BankRuleDraftHost />
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
      <TabPrefetch />
      <WalletHeader />
      <WalletBody />
      <BankRuleDraftHost />
    </WalletProvider>
  );
};
