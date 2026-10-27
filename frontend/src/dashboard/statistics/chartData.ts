import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";

export interface MonthlyBucket {
  date: Date;
  income: number;
  expense: number;
}

/**
 * Groups transactions into monthly buckets, sorted by date ascending.
 */
export function buildMonthlyBuckets(
  transactions: Transaction[],
): MonthlyBucket[] {
  if (transactions.length === 0) return [];

  const bucketsMap = new Map<string, MonthlyBucket>();

  transactions.forEach((tx) => {
    const d = new Date(tx.transactionDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${month}`;

    if (!bucketsMap.has(key)) {
      bucketsMap.set(key, {
        date: new Date(year, month, 1),
        income: 0,
        expense: 0,
      });
    }

    const bucket = bucketsMap.get(key)!;
    if (tx.type === "INCOME") {
      bucket.income += tx.amount;
    } else if (tx.type === "EXPENSE") {
      bucket.expense += tx.amount;
    }
  });

  return Array.from(bucketsMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

// A type alias (not an interface) so it satisfies MUI's index-signature dataset type.
export type MonthlyChartRow = {
  label: string;
  income: number;
  expense: number;
  balance: number;
};

const bucketLabel = (b: MonthlyBucket): string =>
  `${MONTH_LABELS[b.date.getMonth()]} ${b.date.getFullYear()}`;

/** One row per month: that month's income, expense and net balance. */
export function toSnapshotRows(buckets: MonthlyBucket[]): MonthlyChartRow[] {
  return buckets.map((b) => ({
    label: bucketLabel(b),
    income: b.income,
    expense: b.expense,
    balance: b.income - b.expense,
  }));
}

/**
 * Running totals from the very first month, so zooming into recent months
 * still shows the accumulated amounts.
 */
export function toCumulativeRows(buckets: MonthlyBucket[]): MonthlyChartRow[] {
  let cumIncome = 0;
  let cumExpense = 0;
  return buckets.map((b) => {
    cumIncome += b.income;
    cumExpense += b.expense;
    return {
      label: bucketLabel(b),
      income: cumIncome,
      expense: cumExpense,
      balance: cumIncome - cumExpense,
    };
  });
}
