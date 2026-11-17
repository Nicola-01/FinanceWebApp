import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";
import { isInvestmentTx, sumFlows } from "../../utils/investments.ts";
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

/** Income/expense totals (investment tags excluded), with per-active-month averages. */
export function summarize(
  transactions: Transaction[],
  invest: Set<string>,
): SummaryStats {
  const flows = sumFlows(transactions, invest);
  const activeMonths = buildMonthlyBuckets(transactions, invest).length;
  const per = (v: number) => (activeMonths > 0 ? v / activeMonths : 0);
  return {
    income: flows.income,
    expense: flows.spent,
    net: flows.net,
    avgIncome: per(flows.income),
    avgExpense: per(flows.spent),
    avgNet: per(flows.net),
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
  earnedPct: number | null; // (earned - prevEarned) / prevEarned as a fraction; null when prevEarned is 0
  spentPct: number | null; // (spent - prevSpent) / prevSpent as a fraction; null when prevSpent is 0
  kept: number;
  savingsRate: number | null; // fraction; null when prev earned is 0 or below
}

export interface PeriodSummary {
  earned: number;
  spent: number;
  kept: number;
  savingsRate: number | null; // kept / earned fraction (e.g. -0.3); null when earned is 0 or below
  bought: number; // expenses on investment tags
  cashedOut: number; // income on investment tags
  invested: number; // bought - cashedOut (negative when cashing out more than buying)
  months: number; // elapsed months in the period
  avgEarnedPerMonth: number; // earned / months; 0 when months is 0
  series: PeriodSeries;
  vsPrevious: PeriodComparison | null;
}

/** Earned/spent exclude investment tags; bought/cashed out are only those. */
function sumEarnedSpent(txs: Transaction[], invest: Set<string>) {
  const flows = sumFlows(txs, invest);
  return {
    earned: flows.income,
    spent: flows.spent,
    bought: flows.bought,
    cashedOut: flows.cashedOut,
  };
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
  invest: Set<string>,
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
      const { earned: e, spent: s } = sumEarnedSpent([tx], invest);
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
    const { earned: e, spent: s } = sumEarnedSpent([tx], invest);
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
  current: { earned: number; spent: number },
  invest: Set<string>,
): PeriodComparison | null {
  if (period.kind === "all") return null;
  const prevYear = period.year - 1;
  const lastMonth = period.year === today.getFullYear() ? today.getMonth() : 11;
  const prevTxs = txs.filter((tx) => {
    const { year, month } = txYearMonth(tx);
    return year === prevYear && month <= lastMonth;
  });
  if (prevTxs.length === 0) return null;
  const { earned, spent } = sumEarnedSpent(prevTxs, invest);
  const kept = earned - spent;
  return {
    label: String(prevYear),
    earnedPct: earned === 0 ? null : (current.earned - earned) / earned,
    spentPct: spent === 0 ? null : (current.spent - spent) / spent,
    kept,
    savingsRate: earned <= 0 ? null : kept / earned,
  };
}

/**
 * Totals, savings rate, monthly series and previous-year comparison for a period.
 * Earned and spent exclude investment tags; the investment flows are reported apart.
 */
export function summarizePeriod(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
  invest: Set<string>,
): PeriodSummary {
  const inPeriod = filterByPeriod(txs, period);
  const { earned, spent, bought, cashedOut } = sumEarnedSpent(inPeriod, invest);
  const kept = earned - spent;
  // Months with only investment activity are not "elapsed" for the averages.
  const flowTxs = inPeriod.filter((tx) => !isInvestmentTx(tx, invest));
  const months = elapsedMonths(flowTxs, period, today);
  return {
    earned,
    spent,
    kept,
    savingsRate: earned <= 0 ? null : kept / earned,
    bought,
    cashedOut,
    invested: bought - cashedOut,
    months,
    avgEarnedPerMonth: months === 0 ? 0 : earned / months,
    series: buildSeries(inPeriod, period, today, invest),
    vsPrevious: previousComparison(
      txs,
      period,
      today,
      { earned, spent },
      invest,
    ),
  };
}
