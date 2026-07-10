// Final-phase orchestration for the wallet-creation wizard. Decoupled from React
// so it can be unit-tested. The whole draft is sent to the atomic composite
// endpoint (POST /wallets/full): wallet, tags, subscriptions and transactions
// are persisted in ONE backend transaction, so a failure anywhere means no
// wallet was created at all. Invites can't join that transaction (emails can't
// be unsent), so they are looped best-effort after the wallet exists.

import { AxiosError } from "axios";
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

/** Thrown when the composite create fails — nothing was persisted. */
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

interface WalletFullResponse {
  wallet: { id: string };
  tags: BulkResponse;
  subscriptions: BulkResponse;
  transactions: BulkResponse;
}

const bulkOutcome = (
  resource: ResourceKey,
  body: BulkResponse,
): ResourceOutcome => ({
  resource,
  ok: true,
  created: body.created?.length ?? 0,
  updated: body.updated?.length ?? 0,
  autoCreatedTags: (body.autoCreatedTags ?? []).map((t) => t.name),
});

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
 * Creates the wallet and all its staged data in one atomic call, then loops
 * the invites. Throws {@link WalletCreateError} when the composite call fails —
 * the backend transaction rolled back, so no wallet (or anything else) exists.
 * Only invite failures survive as a non-ok outcome with the wallet kept.
 */
export async function createWalletFromDraft(
  draft: WalletDraft,
): Promise<WalletCreationResult> {
  let data: WalletFullResponse;
  try {
    ({ data } = await api.post("/wallets/full", {
      wallet: {
        name: draft.basics.name,
        description: draft.basics.description,
        icon: draft.basics.icon,
        color: draft.basics.color,
        currency: draft.basics.currency,
      },
      tags: draft.tags,
      subscriptions: draft.subscriptions,
      transactions: draft.transactions,
    }));
  } catch (err) {
    // No response = the request never reached the backend (offline/network).
    if (err instanceof AxiosError && !err.response)
      throw new WalletCreateError(
        "You appear to be offline — reconnect and try again.",
      );
    throw new WalletCreateError(
      getApiErrorDetail(err, "Could not create the wallet"),
    );
  }

  const walletId = data.wallet.id;
  const outcomes: ResourceOutcome[] = [];
  if (draft.tags.length) outcomes.push(bulkOutcome("tags", data.tags));
  if (draft.subscriptions.length)
    outcomes.push(bulkOutcome("subscriptions", data.subscriptions));
  if (draft.transactions.length)
    outcomes.push(bulkOutcome("transactions", data.transactions));
  if (draft.invites.length)
    outcomes.push(await invitesTask(walletId, draft.invites));

  return { walletId, outcomes, anyFailed: outcomes.some((o) => !o.ok) };
}
