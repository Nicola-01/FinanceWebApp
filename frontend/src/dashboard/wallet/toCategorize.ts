import type { Tag, Transaction } from "../../types/domain";

/** Imported transactions still awaiting a real category, newest first. */
export function selectToCategorize(transactions: Transaction[]): Transaction[] {
  return transactions
    .filter((tx) => tx.needsReview)
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime(),
    );
}

/**
 * Whether a transaction has a real category. Imports still on the "To categorise"
 * placeholder stay out of every count, chart and statistic until they're filed.
 */
export const isCategorised = (tx: Transaction): boolean => !tx.needsReview;

/**
 * The tag of the newest already-categorised transaction sharing `tx`'s name
 * (trimmed, case-insensitive), or "" when there is none — the pre-selected
 * suggestion for a bank import.
 */
export function suggestTagName(
  tx: Transaction,
  transactions: Transaction[],
): string {
  const name = tx.name.trim().toLowerCase();
  let best: Transaction | undefined;
  for (const t of transactions) {
    if (t.id === tx.id || !isCategorised(t) || !t.tag?.name) continue;
    if (t.name.trim().toLowerCase() !== name) continue;
    if (!best || t.transactionDate > best.transactionDate) best = t;
  }
  return best?.tag.name ?? "";
}

/**
 * The real tag a review-first bank rule already set on an import awaiting review,
 * or "" while it sits on the "To categorise" placeholder (which is never in the
 * wallet's tag list).
 */
export const reviewTagName = (tx: Transaction, tags: Tag[]): string =>
  tx.needsReview && tags.some((t) => t.name === tx.tag?.name)
    ? tx.tag.name
    : "";
