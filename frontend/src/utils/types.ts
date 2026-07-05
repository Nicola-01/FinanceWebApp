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

export interface Tag {
  id?: string;
  name: string;
  icon: string;
  colorHex: string;
  parentName?: string | null;
  parent?: Tag | null;
}

export interface Transaction {
  id: string;
  subscriptionId?: string;
  name: string;
  tag: Tag;
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeValue?: number;
  type: "INCOME" | "EXPENSE";
  notes?: string;
  transactionDate: string;
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
