import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";
import {
  filterByPeriod,
  txYearMonth,
  type StatsPeriod,
} from "./statsPeriod.ts";

export type InsightTone = "danger" | "income" | "recurring" | "neutral";

export interface Insight {
  id: "expensive-month" | "best-month" | "subscriptions" | "income-steady";
  tone: InsightTone;
  title: string;
  detail: string;
}

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface MonthBucket {
  year: number;
  month: number;
  income: number;
  expense: number;
  expenseTxs: Transaction[];
}

function groupByMonth(txs: Transaction[]): MonthBucket[] {
  const buckets = new Map<number, MonthBucket>();
  for (const tx of txs) {
    const { year, month } = txYearMonth(tx);
    const key = year * 12 + month;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { year, month, income: 0, expense: 0, expenseTxs: [] };
      buckets.set(key, bucket);
    }
    if (tx.type === "INCOME") {
      bucket.income += tx.amount;
    } else {
      bucket.expense += tx.amount;
      bucket.expenseTxs.push(tx);
    }
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => bucket);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** First item (in chronological order) with the strictly greatest score. */
function maxBy<T>(items: T[], score: (item: T) => number): T {
  return items.reduce((best, item) =>
    score(item) > score(best) ? item : best,
  );
}

function money(value: number, symbol: string): string {
  return Math.round(value).toLocaleString("it-IT") + " " + symbol;
}

function signedMoney(value: number, symbol: string): string {
  return (value < 0 ? "−" : "+") + money(Math.abs(value), symbol);
}

function monthName(bucket: MonthBucket, period: StatsPeriod): string {
  const name = FULL_MONTHS[bucket.month];
  return period.kind === "all" ? `${name} ${bucket.year}` : name;
}

function dayLabel(tx: Transaction, period: StatsPeriod): string {
  // Day comes straight from the string, same reason as txYearMonth.
  const day = Number(tx.transactionDate.slice(8, 10));
  const { year, month } = txYearMonth(tx);
  const label = `${day} ${MONTH_LABELS[month]}`;
  return period.kind === "all" ? `${label} ${year}` : label;
}

function expensiveMonth(
  months: MonthBucket[],
  period: StatsPeriod,
  symbol: string,
): Insight | null {
  const med = median(months.map((m) => m.expense));
  const top = maxBy(months, (m) => m.expense);
  if (med <= 0 || top.expense < 2 * med) return null;

  const ratio = Math.round(top.expense / med);
  const biggest = maxBy(top.expenseTxs, (tx) => tx.amount);
  const sentences = [`${ratio}× your usual month.`];
  if (biggest.amount >= 0.4 * top.expense) {
    sentences.push(
      `${money(biggest.amount, symbol)} of it is one ${biggest.tag.name} transaction on ${dayLabel(biggest, period)}.`,
    );
  }
  return {
    id: "expensive-month",
    tone: "danger",
    title: `${monthName(top, period)} cost ${money(top.expense, symbol)}`,
    detail: sentences.join(" "),
  };
}

function bestMonth(
  months: MonthBucket[],
  period: StatsPeriod,
  symbol: string,
): Insight | null {
  const top = maxBy(months, (m) => m.income - m.expense);
  const kept = top.income - top.expense;
  if (kept <= 0 || top.income <= 0) return null;

  const pct = Math.round((kept / top.income) * 100);
  return {
    id: "best-month",
    tone: "income",
    title: `Best month: ${monthName(top, period)}, ${signedMoney(kept, symbol)}`,
    detail: `You kept ${pct}% of what you earned.`,
  };
}

function subscriptions(months: MonthBucket[], symbol: string): Insight | null {
  const expenseTxs = months.flatMap((m) => m.expenseTxs);
  const total = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const subscribed = expenseTxs
    .filter((tx) => tx.subscriptionId)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const share = total > 0 ? subscribed / total : 0;
  if (share <= 0) return null;

  return {
    id: "subscriptions",
    tone: "recurring",
    title: `Subscriptions are ${Math.round(share * 100)}% of spending`,
    detail: `About ${money(subscribed / months.length, symbol)} a month, before anything else.`,
  };
}

function incomeSteady(
  months: MonthBucket[],
  period: StatsPeriod,
  symbol: string,
): Insight | null {
  const incomes = months.filter((m) => m.income > 0).map((m) => m.income);
  if (incomes.length < 3) return null;

  const min = Math.min(...incomes);
  const max = Math.max(...incomes);
  const suffix = period.kind === "year" ? " this year" : "";
  return {
    id: "income-steady",
    tone: "neutral",
    title: max <= 1.25 * min ? "Income is steady" : "Income varies",
    detail: `Between ${money(min, symbol)} and ${money(max, symbol)} every month${suffix}.`,
  };
}

/** Up to four plain-language insights for the period; [] below 3 months of data. */
export function buildInsights(
  txs: Transaction[],
  period: StatsPeriod,
  currencySymbol: string,
): Insight[] {
  const months = groupByMonth(filterByPeriod(txs, period));
  if (months.length < 3) return [];

  return [
    expensiveMonth(months, period, currencySymbol),
    bestMonth(months, period, currencySymbol),
    subscriptions(months, currencySymbol),
    incomeSteady(months, period, currencySymbol),
  ].filter((insight): insight is Insight => insight !== null);
}
