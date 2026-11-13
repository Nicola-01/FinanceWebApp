import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";
import { buildMonthlyBuckets } from "./chartData.ts";
import {
  availableYears,
  filterByPeriod,
  txYearMonth,
  type StatsPeriod,
} from "./statsPeriod.ts";

export interface SummaryStats {
  income: number;
  expense: number;
  net: number;
  avgIncome: number;
  avgExpense: number;
  avgNet: number;
}

/** Totals over the given transactions, with per-active-month averages. */
export function summarize(transactions: Transaction[]): SummaryStats {
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === "INCOME") acc.income += tx.amount;
      else if (tx.type === "EXPENSE") acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
  const net = totals.income - totals.expense;
  const activeMonths = buildMonthlyBuckets(transactions).length;
  const per = (v: number) => (activeMonths > 0 ? v / activeMonths : 0);
  return {
    income: totals.income,
    expense: totals.expense,
    net,
    avgIncome: per(totals.income),
    avgExpense: per(totals.expense),
    avgNet: per(net),
  };
}

export interface PeriodSeries {
  labels: string[]; // year: "Jan".."Dec"; all: "2024","2025",… oldest first
  earned: (number | null)[]; // null = slot in the future
  spent: (number | null)[];
  kept: (number | null)[]; // earned - spent
  rate: (number | null)[]; // kept / earned as a fraction; null when earned is 0 or slot is future
}

export interface PeriodComparison {
  label: string; // previous year, e.g. "2025"
  spentPct: number | null; // (spent - prevSpent) / prevSpent as a fraction; null when prevSpent is 0
  kept: number;
  savingsRate: number | null; // fraction; null when prev earned is 0
}

export interface PeriodSummary {
  earned: number;
  spent: number;
  kept: number;
  savingsRate: number | null; // kept / earned fraction (e.g. -0.3); null when earned is 0
  months: number; // elapsed months in the period
  avgEarnedPerMonth: number; // earned / months; 0 when months is 0
  series: PeriodSeries;
  vsPrevious: PeriodComparison | null;
}

function sumEarnedSpent(txs: Transaction[]): { earned: number; spent: number } {
  return txs.reduce(
    (acc, tx) => {
      if (tx.type === "INCOME") acc.earned += tx.amount;
      else if (tx.type === "EXPENSE") acc.spent += tx.amount;
      return acc;
    },
    { earned: 0, spent: 0 },
  );
}

function finishSeries(
  labels: string[],
  earnedRaw: number[],
  spentRaw: number[],
  isFuture: boolean[],
): PeriodSeries {
  const earned = earnedRaw.map((v, i) => (isFuture[i] ? null : v));
  const spent = spentRaw.map((v, i) => (isFuture[i] ? null : v));
  const kept = earned.map((e, i) => {
    const s = spent[i];
    return e === null || s === null ? null : e - s;
  });
  const rate = earned.map((e, i) => {
    const k = kept[i];
    return e === null || k === null || e === 0 ? null : k / e;
  });
  return { labels, earned, spent, kept, rate };
}

function buildSeries(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
): PeriodSeries {
  if (period.kind === "all") {
    const years = availableYears(txs);
    if (years.length === 0) {
      return { labels: [], earned: [], spent: [], kept: [], rate: [] };
    }
    const oldest = years[years.length - 1];
    const count = years[0] - oldest + 1;
    const earned = new Array<number>(count).fill(0);
    const spent = new Array<number>(count).fill(0);
    for (const tx of txs) {
      const slot = txYearMonth(tx).year - oldest;
      const { earned: e, spent: s } = sumEarnedSpent([tx]);
      earned[slot] += e;
      spent[slot] += s;
    }
    const labels = Array.from({ length: count }, (_, i) => String(oldest + i));
    return finishSeries(labels, earned, spent, new Array(count).fill(false));
  }

  const earned = new Array<number>(12).fill(0);
  const spent = new Array<number>(12).fill(0);
  for (const tx of txs) {
    const slot = txYearMonth(tx).month;
    const { earned: e, spent: s } = sumEarnedSpent([tx]);
    earned[slot] += e;
    spent[slot] += s;
  }
  const isFuture = MONTH_LABELS.map(
    (_, m) =>
      period.year > today.getFullYear() ||
      (period.year === today.getFullYear() && m > today.getMonth()),
  );
  return finishSeries([...MONTH_LABELS], earned, spent, isFuture);
}

function elapsedMonths(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
): number {
  if (period.kind === "all") {
    if (txs.length === 0) return 0;
    const firstIdx = txs.reduce((min, tx) => {
      const { year, month } = txYearMonth(tx);
      return Math.min(min, year * 12 + month);
    }, Infinity);
    const todayIdx = today.getFullYear() * 12 + today.getMonth();
    return Math.max(0, todayIdx - firstIdx + 1);
  }
  if (period.year < today.getFullYear()) return 12;
  if (period.year === today.getFullYear()) return today.getMonth() + 1;
  return 0;
}

/** Same-months comparison against the previous year; all → null. */
function previousComparison(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
  spentNow: number,
): PeriodComparison | null {
  if (period.kind === "all") return null;
  const prevYear = period.year - 1;
  const lastMonth = period.year === today.getFullYear() ? today.getMonth() : 11;
  const prevTxs = txs.filter((tx) => {
    const { year, month } = txYearMonth(tx);
    return year === prevYear && month <= lastMonth;
  });
  if (prevTxs.length === 0) return null;
  const { earned, spent } = sumEarnedSpent(prevTxs);
  const kept = earned - spent;
  return {
    label: String(prevYear),
    spentPct: spent === 0 ? null : (spentNow - spent) / spent,
    kept,
    savingsRate: earned === 0 ? null : kept / earned,
  };
}

/** Totals, savings rate, monthly series and previous-year comparison for a period. */
export function summarizePeriod(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
): PeriodSummary {
  const inPeriod = filterByPeriod(txs, period);
  const { earned, spent } = sumEarnedSpent(inPeriod);
  const kept = earned - spent;
  const months = elapsedMonths(inPeriod, period, today);
  return {
    earned,
    spent,
    kept,
    savingsRate: earned === 0 ? null : kept / earned,
    months,
    avgEarnedPerMonth: months === 0 ? 0 : earned / months,
    series: buildSeries(inPeriod, period, today),
    vsPrevious: previousComparison(txs, period, today, spent),
  };
}
