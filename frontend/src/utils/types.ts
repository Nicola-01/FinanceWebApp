// src/types/types.ts

export interface User {
  id: string;
  name: string;
  token: string;

  createdAt?: string;
  wallets?: number;
  transactions?: number;
}

export interface Wallet {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  currency: string;
  createdAt: string;
  userRole: "OWNER" | "EDITOR" | "VIEWER";
  wallet?: Wallet;
}

/** Offline sync status of a pending domain op, overlaid onto read data by applyPendingOps. */
export type SyncState = "pending" | "failed" | "conflict";

export interface Tag {
  id?: string;
  name: string;
  icon: string;
  colorHex: string;
  parentName?: string | null;
  parent?: Tag | null;
  updatedAt?: string;
  syncState?: SyncState;
}

export interface Transaction {
  id: string;
  subscriptionId?: string;
  name: string;
  tag: Tag;
  amount: number;
  amountPending?: boolean;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeValue?: number;
  type: "INCOME" | "EXPENSE";
  notes?: string;
  transactionDate: string;
  updatedAt?: string;
  syncState?: SyncState;
}

export interface WalletMember {
  userId: string;
  username: string;
  email: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "LEFT" | "REVOKED";
  invitedAt: string;
}

export interface Invitation {
  walletOwner: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "LEFT" | "REVOKED";
  invitedAt: string;
  wallet: Wallet;
}

export interface Subscription {
  id: string;
  name: string;
  tag: Tag;
  amount: number;
  amountPending?: boolean;
  originalAmount: number;
  originalCurrency: string;
  exchangeValue: number;
  autoExchangeRate: boolean;
  type: "INCOME" | "EXPENSE";
  notes?: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";

  startDate: string; // ISO Date (YYYY-MM-DD)
  nextExecutionDate: string;
  lastExecutionDate?: string;

  frequencyType: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  frequencyInterval: number;
  monthlySpecificDay?: number;
  lastWorkingDayOfMonth: boolean;

  duration: "FOREVER" | "TIMES" | "UNTIL";
  durationTimes?: number;
  executedTimes: number;
  durationUntil?: string;
  history?: Transaction[];
  updatedAt?: string;
  syncState?: SyncState;
}

export interface Budget {
  id: string;
  name: string;
  tagName?: string | null; // null = whole-wallet budget
  limitAmount: number;
  periodType: "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  startDate: string;
  endDate?: string | null;
  rollover: boolean;
  alertThresholds: number[];
  // Computed by the backend for the current period
  periodStart: string;
  periodEnd: string;
  spent: number;
  effectiveLimit: number;
  remaining: number;
  percentUsed: number;
  status: "OK" | "WARNING" | "EXCEEDED";
  crossedThresholds: number[];
  active: boolean;
}

export interface BudgetPayload {
  name: string;
  tagName?: string | null;
  limitAmount: number;
  periodType: Budget["periodType"];
  startDate?: string;
  endDate?: string | null;
  rollover?: boolean;
  alertThresholds?: number[];
}

export interface WalletDashboardData {
  wallet: Wallet;
  transactions: Transaction[];
  subscriptions: Subscription[];
  tags: Tag[];
}

export interface SubscriptionRequestDTO {
  name: string;
  tag: string;
  amount: number;
  amountPending?: boolean;
  originalAmount: number;
  originalCurrency: string;
  exchangeValue: number;
  autoExchangeRate: boolean;
  type: "INCOME" | "EXPENSE";
  notes?: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate: string;
  frequencyType: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  frequencyInterval: number;
  monthlySpecificDay?: number;
  lastWorkingDayOfMonth: boolean;
  duration: "FOREVER" | "TIMES" | "UNTIL";
  durationTimes?: number;
  durationUntil?: string;
}

export interface WalletPermissionDto {
  walletId: string;
  permissions: string[];
}

export interface PatToken {
  id: string;
  name: string;
  tokenPrefix: string;
  walletPermissions: WalletPermissionDto[];
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  /** When true the token is temporarily disabled — kept, but rejected on the API. */
  paused: boolean;
}

export type ModalView = "list" | "create" | "edit" | "showToken";

export interface WalletPermState {
  walletId: string;
  walletName: string;
  walletIcon: string;
  walletColor: string;
  userRole?: string;
  enabled: boolean;
  read: boolean;
  write: boolean;
}

export type ThemeVariant = "default" | "oauth";
