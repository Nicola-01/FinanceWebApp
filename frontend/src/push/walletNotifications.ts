import api from "../api/axiosConfig";

/** The caller's notification preferences for one wallet (master mute + event types). */
export interface WalletNotificationPrefs {
  muted: boolean;
  transactions: boolean;
  subscriptions: boolean;
  recurringExecutions: boolean;
  budgets: boolean;
  /** Included in the monthly / yearly report; independent of `muted`. */
  monthlyReport: boolean;
  yearlyReport: boolean;
}

/** One entry of `wallets` in GET /users/me/notification-preferences. */
export interface WalletPrefsEntry extends WalletNotificationPrefs {
  walletId: string;
  walletName: string;
}

export type WalletEventKey = Exclude<
  keyof WalletNotificationPrefs,
  "muted" | "monthlyReport" | "yearlyReport"
>;

/** Older backends omit the report flags; a missing one counts as included. */
export function withReportDefaults(entry: WalletPrefsEntry): WalletPrefsEntry {
  return {
    ...entry,
    monthlyReport: entry.monthlyReport ?? true,
    yearlyReport: entry.yearlyReport ?? true,
  };
}

export const WALLET_EVENT_OPTIONS: {
  key: WalletEventKey;
  label: string;
  hint: string;
}[] = [
  {
    key: "transactions",
    label: "Transactions",
    hint: "When another member adds, edits or deletes one",
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    hint: "When another member adds, edits or deletes one",
  },
  {
    key: "recurringExecutions",
    label: "Recurring executions",
    hint: "When a subscription is charged automatically",
  },
  {
    key: "budgets",
    label: "Budget alerts",
    hint: "When a budget reaches one of its alert thresholds",
  },
];

/** Turning a wallet's notifications on re-enables every event type. */
export function setWalletEnabled<T extends WalletNotificationPrefs>(
  prefs: T,
  enabled: boolean,
): T {
  return enabled
    ? {
        ...prefs,
        muted: false,
        transactions: true,
        subscriptions: true,
        recurringExecutions: true,
        budgets: true,
      }
    : { ...prefs, muted: true };
}

export function saveWalletNotificationPrefs(
  walletId: string,
  {
    muted,
    transactions,
    subscriptions,
    recurringExecutions,
    budgets,
    monthlyReport,
    yearlyReport,
  }: WalletNotificationPrefs,
) {
  return api.put(`/wallets/${walletId}/notification-preferences`, {
    muted,
    transactions,
    subscriptions,
    recurringExecutions,
    budgets,
    monthlyReport,
    yearlyReport,
  });
}
