import Dexie, { type Table } from "dexie";

export interface CacheItem {
  url: string;
  data: unknown;
  timestamp: number;
}

export type OpEntityType = "transaction" | "subscription" | "tag" | "wallet";
export type OpKind = "create" | "update" | "delete";
export type OpStatus = "pending" | "syncing" | "failed" | "conflict";
export type ConflictKind = "stale" | "missing";

export interface PendingOp {
  id?: number;
  walletId: string;
  entityType: OpEntityType;
  /** UUID for transaction/subscription, tag NAME for tags, walletId for wallet ops. */
  entityKey: string;
  op: OpKind;
  payload: Record<string, unknown>;
  /** Server updatedAt the edit was based on (ISO string) — precondition on replay. */
  baseUpdatedAt: string | null;
  status: OpStatus;
  conflictKind?: ConflictKind;
  lastError?: string;
  attempts: number;
  createdAt: number;
}

export class FinanceDb extends Dexie {
  cache!: Table<CacheItem, string>;
  ops!: Table<PendingOp, number>;

  constructor() {
    super("FinanceAppOffline");
    this.version(1).stores({
      cache: "url",
      syncQueue: "++id, createdAt",
    });
    // v2: raw-HTTP syncQueue → typed domain ops. Old raw entries are dropped on
    // upgrade (they cannot be classified retroactively; accepted one-time loss).
    this.version(2).stores({
      cache: "url",
      syncQueue: null,
      ops: "++id, walletId, status, createdAt",
    });
  }
}

export const offlineDb = new FinanceDb();
