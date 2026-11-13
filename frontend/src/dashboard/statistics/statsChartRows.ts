import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";
import { compactAmount } from "./kitChartData.ts";
import {
  availableYears,
  filterByPeriod,
  txYearMonth,
  type StatsPeriod,
} from "./statsPeriod.ts";

export interface MonthByMonthRow {
  [key: string]: unknown;
  date: Date;
  income?: number;
  expense?: number;
  kept?: number;
}

export interface WaterfallRow {
  [key: string]: unknown;
  label: string;
  value?: number;
  total?: true;
}

export interface FixedEverydayRow {
  [key: string]: unknown;
  date: Date;
  subscriptions: number;
  everyday: number;
  everydayCapped: number;
  overflow?: string;
}

/** One chart slot: a month of a year period, or a calendar year of the all-time period. */
interface Slot {
  date: Date;
  txs: Transaction[];
}

/** Last month index (0-based) that has a slot; -1 for a future year. */
function lastMonthOf(year: number, today: Date): number {
  if (year < today.getFullYear()) return 11;
  if (year === today.getFullYear()) return today.getMonth();
  return -1;
}

/** Every year from the oldest to the newest year in the data, gaps included. */
function yearRange(txs: Transaction[]): number[] {
  if (txs.length === 0) return [];
  const years = availableYears(txs);
  const oldest = years[years.length - 1];
  const newest = years[0];
  return Array.from({ length: newest - oldest + 1 }, (_, i) => oldest + i);
}

function slotsOf(txs: Transaction[], period: StatsPeriod, today: Date): Slot[] {
  if (period.kind === "year") {
    const yearTxs = filterByPeriod(txs, period);
    const last = lastMonthOf(period.year, today);
    return Array.from({ length: last + 1 }, (_, month) => ({
      date: new Date(period.year, month, 1),
      txs: yearTxs.filter((tx) => txYearMonth(tx).month === month),
    }));
  }
  return yearRange(txs).map((year) => ({
    date: new Date(year, 0, 1),
    txs: txs.filter((tx) => txYearMonth(tx).year === year),
  }));
}

function income(txs: Transaction[]): number {
  return txs
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function expense(txs: Transaction[]): number {
  return txs
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function netOf(txs: Transaction[]): number {
  return income(txs) - expense(txs);
}

/** Month by month: income, expense (negative) and kept per slot. */
export function monthByMonthRows(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
): MonthByMonthRow[] {
  const toRow = (slot: Slot): MonthByMonthRow => {
    const inc = income(slot.txs);
    const exp = expense(slot.txs);
    return {
      date: slot.date,
      income: inc,
      expense: exp === 0 ? 0 : -exp,
      kept: inc - exp,
    };
  };
  const slots = slotsOf(txs, period, today);
  if (period.kind === "all") return slots.map(toRow);
  return Array.from({ length: 12 }, (_, month) =>
    slots[month]
      ? toRow(slots[month])
      : { date: new Date(period.year, month, 1) },
  );
}

/** Running net per slot, framed by an opening total and a closing total. */
export function waterfallRows(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
): WaterfallRow[] {
  if (period.kind === "all") {
    if (txs.length === 0) return [];
    const rows: WaterfallRow[] = slotsOf(txs, period, today).map((slot) => ({
      label: String(slot.date.getFullYear()),
      value: netOf(slot.txs),
    }));
    return [...rows, { label: "Now", total: true }];
  }

  const last = lastMonthOf(period.year, today);
  if (last < 0) return [];
  const opening = netOf(txs.filter((tx) => txYearMonth(tx).year < period.year));
  const months: WaterfallRow[] = slotsOf(txs, period, today).map((slot) => ({
    label: MONTH_LABELS[slot.date.getMonth()],
    value: netOf(slot.txs),
  }));
  const closing: WaterfallRow =
    period.year === today.getFullYear()
      ? { label: "Now", total: true }
      : { label: "31 Dec", total: true };
  return [{ label: "1 Jan", value: opening, total: true }, ...months, closing];
}

/** Expense split into subscription-generated vs everyday, with an outlier cap. */
export function fixedVsEverydayRows(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
): FixedEverydayRow[] {
  const slots = slotsOf(txs, period, today).map((slot) => {
    const expenses = slot.txs.filter((tx) => tx.type === "EXPENSE");
    const subscriptions = expenses
      .filter((tx) => !!tx.subscriptionId)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const everyday = expenses
      .filter((tx) => !tx.subscriptionId)
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { date: slot.date, subscriptions, everyday };
  });

  // The 2nd-highest slot sets the cap so a single outlier month cannot raise it.
  const totals = slots
    .map((s) => s.subscriptions + s.everyday)
    .sort((a, b) => b - a);
  const cap = slots.length >= 3 ? 1.5 * totals[1] : Infinity;

  return slots.map((s) => {
    const total = s.subscriptions + s.everyday;
    if (total <= cap) return { ...s, everydayCapped: s.everyday };
    return {
      ...s,
      everydayCapped: Math.max(0, cap - s.subscriptions),
      overflow: compactAmount(total) + " ↑",
    };
  });
}

/** End-of-month running balance from the first transaction's month up to today's month. */
export function balanceHistory(
  txs: Transaction[],
  today: Date,
): { date: Date; balance: number }[] {
  if (txs.length === 0) return [];
  // Month index = year * 12 + month (0-based), so consecutive months differ by 1.
  const deltas = new Map<number, number>();
  let first = Infinity;
  for (const tx of txs) {
    const { year, month } = txYearMonth(tx);
    const key = year * 12 + month;
    first = Math.min(first, key);
    const signed = tx.type === "INCOME" ? tx.amount : -tx.amount;
    deltas.set(key, (deltas.get(key) ?? 0) + signed);
  }
  const end = today.getFullYear() * 12 + today.getMonth();
  const out: { date: Date; balance: number }[] = [];
  let balance = 0;
  for (let key = first; key <= end; key++) {
    balance += deltas.get(key) ?? 0;
    out.push({
      date: new Date(Math.floor(key / 12), key % 12, 1),
      balance,
    });
  }
  return out;
}

/** Symmetric y bound for Month by month: the largest magnitude × 1.1, or 100 when empty/zero. */
export function symmetricBound(rows: MonthByMonthRow[]): number {
  let peak = 0;
  for (const row of rows) {
    for (const value of [row.income, row.expense, row.kept]) {
      if (value !== undefined) peak = Math.max(peak, Math.abs(value));
    }
  }
  return peak === 0 ? 100 : peak * 1.1;
}
