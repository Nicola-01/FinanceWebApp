// Final-phase orchestration for the wallet-creation wizard. Decoupled from React
// so it can be unit-tested. Creates the wallet first (blocking), then fires the
// staged bulk imports in parallel and loops the invites, aggregating a
// per-resource result. The bulk endpoints are all-or-nothing, so a resource is
// reported as a whole (created/updated counts on success, or an error string).

import api from "../../api/axiosConfig";
import { getApiErrorDetail } from "../../utils/apiError";
import type {
  TagRequest,
  TransactionRequest,
  SubscriptionRequest,
} from "../../dashboard/settings/csvImport";

export interface WalletInvite {
  user: string;
  role: "VIEWER" | "EDITOR";
}

export interface WalletBasics {
  name: string;
  description: string;
  icon: string;
  color: string;
  currency: string;
}

export interface WalletDraft {
  basics: WalletBasics;
  tags: TagRequest[];
  subscriptions: SubscriptionRequest[];
  transactions: TransactionRequest[];
  invites: WalletInvite[];
}

export type ResourceKey = "tags" | "subscriptions" | "transactions" | "invites";

export interface ResourceOutcome {
  resource: ResourceKey;
  ok: boolean;
  /** Bulk resources (tags/subscriptions/transactions). */
  created?: number;
  updated?: number;
  autoCreatedTags?: string[];
  /** Invites. */
  sent?: number;
  failed?: number;
  /** Set when ok === false. */
  error?: string;
}

export interface WalletCreationResult {
  walletId: string;
  /** One entry per staged resource (empty resources are skipped entirely). */
  outcomes: ResourceOutcome[];
  anyFailed: boolean;
}

/** Thrown when the wallet itself couldn't be created — the blocking failure. */
export class WalletCreateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletCreateError";
  }
}

interface BulkResponse {
  created?: unknown[];
  updated?: unknown[];
  autoCreatedTags?: { name: string }[];
}

async function bulkTask(
  resource: ResourceKey,
  endpoint: string,
  payload: unknown[],
): Promise<ResourceOutcome> {
  try {
    const { data } = await api.post(endpoint, payload);
    const body = data as BulkResponse;
    return {
      resource,
      ok: true,
      created: body.created?.length ?? 0,
      updated: body.updated?.length ?? 0,
      autoCreatedTags: (body.autoCreatedTags ?? []).map((t) => t.name),
    };
  } catch (err) {
    return {
      resource,
      ok: false,
      error: getApiErrorDetail(err, "Import failed"),
    };
  }
}

async function invitesTask(
  walletId: string,
  invites: WalletInvite[],
): Promise<ResourceOutcome> {
  const results = await Promise.allSettled(
    invites.map((inv) =>
      api.post(`/invitations/${walletId}`, { user: inv.user, role: inv.role }),
    ),
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  return { resource: "invites", ok: failed === 0, sent, failed };
}

/**
 * Creates the wallet from the draft, then imports the staged data. Throws
 * {@link WalletCreateError} if the wallet POST fails (nothing else runs); a
 * later import failure is captured in that resource's outcome, and the wallet is
 * kept.
 */
export async function createWalletFromDraft(
  draft: WalletDraft,
): Promise<WalletCreationResult> {
  let walletId: string;
  try {
    const { data } = await api.post("/wallets", {
      name: draft.basics.name,
      description: draft.basics.description,
      icon: draft.basics.icon,
      color: draft.basics.color,
      currency: draft.basics.currency,
    });
    walletId = (data as { id: string }).id;
  } catch (err) {
    throw new WalletCreateError(
      getApiErrorDetail(err, "Could not create the wallet"),
    );
  }

  const tasks: Promise<ResourceOutcome>[] = [];
  if (draft.tags.length)
    tasks.push(bulkTask("tags", `/tags/${walletId}/bulk`, draft.tags));
  if (draft.subscriptions.length)
    tasks.push(
      bulkTask(
        "subscriptions",
        `/subscription/${walletId}/bulk`,
        draft.subscriptions,
      ),
    );
  if (draft.transactions.length)
    tasks.push(
      bulkTask(
        "transactions",
        `/transactions/${walletId}/bulk`,
        draft.transactions,
      ),
    );
  if (draft.invites.length) tasks.push(invitesTask(walletId, draft.invites));

  const outcomes = await Promise.all(tasks);
  return { walletId, outcomes, anyFailed: outcomes.some((o) => !o.ok) };
}
