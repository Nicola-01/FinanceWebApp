import api from "./axiosConfig";

// Online-only (like members/PATs): not routed through the offline ops queue.
export interface BankAccountLink {
  id: string;
  displayName: string;
  maskedIban?: string;
  lastSyncedAt?: string;
  importedCount: number;
}

export interface BankConnection {
  id: string;
  walletId: string;
  aspspName: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "PAUSED" | "ERROR";
  validUntil?: string;
  lastError?: string;
  accounts: BankAccountLink[];
}

export interface Aspsp {
  name: string;
  country: string;
  maximumConsentValidity?: number;
}

export const getWalletBank = (walletId: string) =>
  api
    .get<{
      enabled: boolean;
      connections: BankConnection[];
    }>(`/bank/wallets/${walletId}`)
    .then((r) => r.data);

export const listAspsps = (country: string) =>
  api.get<Aspsp[]>("/bank/aspsps", { params: { country } }).then((r) => r.data);

export const connectBank = (
  walletId: string,
  body: { aspspName: string; country: string; importFrom: string },
) =>
  api
    .post<{ url: string }>(`/bank/wallets/${walletId}/connect`, body)
    .then((r) => r.data);

export const completeBankCallback = (code: string, state: string) =>
  api
    .post<BankConnection>("/bank/callback", { code, state })
    .then((r) => r.data);

export const renewConnection = (id: string) =>
  api
    .post<{ url: string }>(`/bank/connections/${id}/renew`)
    .then((r) => r.data);

export interface SyncResult {
  connectionId: string;
  imported: number;
  status: BankConnection["status"];
}

export const syncConnection = (id: string) =>
  api.post<SyncResult>(`/bank/connections/${id}/sync`).then((r) => r.data);

export const syncWalletIfStale = (walletId: string) =>
  api
    .post<{ connectionId: string; imported: number; status: string }[]>(
      `/bank/wallets/${walletId}/sync-if-stale`,
    )
    .then((r) => r.data);

export const deleteConnection = (id: string) =>
  api.delete(`/bank/connections/${id}`).then(() => undefined);
