import type { Transaction } from "../../types/domain.ts";

/**
 * Buckets transactions by `transactionDate` (input order kept within a day)
 * and returns the dates newest first.
 */
export function groupTransactionsByDate(transactions: Transaction[]): {
  groups: Record<string, Transaction[]>;
  sortedDates: string[];
} {
  const groups = transactions.reduce(
    (acc, tx) => {
      if (!acc[tx.transactionDate]) acc[tx.transactionDate] = [];
      acc[tx.transactionDate].push(tx);
      return acc;
    },
    {} as Record<string, Transaction[]>,
  );

  // Newest date first.
  const sortedDates = Object.keys(groups).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return { groups, sortedDates };
}

/** Day-group header: "Today - …" / "Yesterday - …" / plain en-GB date. */
export function formatDateHeader(dateStr: string, now = new Date()): string {
  const date = new Date(dateStr);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatedDate = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (date.toDateString() === now.toDateString())
    return `Today - ${formatedDate}`;
  if (date.toDateString() === yesterday.toDateString())
    return `Yesterday - ${formatedDate}`;

  return formatedDate;
}
