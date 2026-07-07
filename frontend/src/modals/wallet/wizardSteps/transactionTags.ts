import type {
  TagRequest,
  TransactionRequest,
} from "../../../dashboard/settings/csvImport";

const tagKey = (s: string) => s.trim().toLowerCase();

/**
 * A staged transaction has an *unresolved* tag when it names a (non-empty) tag
 * that isn't among the wallet's staged tags — the same guard the Subscriptions
 * step applies. Such a transaction can't be imported as-is: the missing tag must
 * be added (in the Tags step) first. An empty tag isn't treated as unresolved
 * (it's simply uncategorised).
 */
export const transactionTagUnresolved = (
  tx: TransactionRequest,
  tags: TagRequest[],
): boolean => {
  const name = tx.tag?.trim() ?? "";
  return name !== "" && !tags.some((t) => tagKey(t.name) === tagKey(name));
};

/**
 * How many *distinct* tags (case-insensitive, trimmed) referenced by staged
 * transactions aren't among `tags`. Zero means nothing blocks Continue.
 */
export const missingTransactionTagCount = (
  transactions: TransactionRequest[],
  tags: TagRequest[],
): number => groupMissingTransactionTags(transactions, tags).length;

/** One unresolved tag plus how many staged transactions reference it. */
export interface MissingTagGroup {
  /** The tag name as first seen on a staged transaction (original casing). */
  name: string;
  /** Case-insensitive, trimmed key used to match transactions. */
  key: string;
  /** How many staged transactions reference this (missing) tag. */
  count: number;
}

/**
 * Group staged transactions by their *unresolved* tag — first-seen order and
 * casing preserved. Empty/resolved tags are excluded. Powers the per-tag
 * resolution panel (create / reassign / remove) so the user sees *which* tags
 * are missing and how many rows each affects.
 */
export const groupMissingTransactionTags = (
  transactions: TransactionRequest[],
  tags: TagRequest[],
): MissingTagGroup[] => {
  const groups = new Map<string, MissingTagGroup>();
  for (const tx of transactions) {
    if (!transactionTagUnresolved(tx, tags)) continue;
    const name = tx.tag.trim();
    const key = tagKey(name);
    const existing = groups.get(key);
    if (existing) existing.count += 1;
    else groups.set(key, { name, key, count: 1 });
  }
  return [...groups.values()];
};

/**
 * Re-tag every staged transaction whose tag matches `fromKey` (case-insensitive)
 * to `toName`, leaving the rest untouched. Returns a new array.
 */
export const reassignTransactionTag = (
  transactions: TransactionRequest[],
  fromKey: string,
  toName: string,
): TransactionRequest[] =>
  transactions.map((tx) =>
    tagKey(tx.tag ?? "") === fromKey ? { ...tx, tag: toName } : tx,
  );

/**
 * Drop every staged transaction whose tag matches `key` (case-insensitive).
 * Returns a new array.
 */
export const removeTransactionsWithTag = (
  transactions: TransactionRequest[],
  key: string,
): TransactionRequest[] =>
  transactions.filter((tx) => tagKey(tx.tag ?? "") !== key);
