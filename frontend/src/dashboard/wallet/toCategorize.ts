import type { Transaction } from "../../types/domain";

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
