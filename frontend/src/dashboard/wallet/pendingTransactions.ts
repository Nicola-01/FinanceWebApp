import type { Transaction } from "../../types/domain";

/** Pending (amount-less) transactions, oldest first — the order the pinned rows render in. */
export function selectPendingTransactions(
  transactions: Transaction[],
): Transaction[] {
  return transactions
    .filter((tx) => tx.amountPending)
    .sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );
}
