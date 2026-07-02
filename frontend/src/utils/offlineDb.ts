import Dexie, { type Table } from "dexie";

export interface CacheItem {
  url: string;
  data: unknown;
  timestamp: number;
}

export interface SyncQueueItem {
  id?: number;
  url: string;
  method: string;
  payload: unknown;
  headers: Record<string, string>;
  createdAt: number;
}

export class FinanceDb extends Dexie {
  cache!: Table<CacheItem, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("FinanceAppOffline");
    this.version(1).stores({
      cache: "url",
      syncQueue: "++id, createdAt",
    });
  }
}

export const offlineDb = new FinanceDb();
