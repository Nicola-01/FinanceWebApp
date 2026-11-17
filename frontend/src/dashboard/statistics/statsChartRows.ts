import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";
import { sumFlows } from "../../utils/investments.ts";
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
  /** Investment outflow (expenses on investment tags), positive. */
  bought?: number;
  /** Investment inflow (income on investment tags), positive. */
  cashedOut?: number;
  /** Income + cashed out − spent − bought: what is left to spend. */
  liquidity?: number;
}

export interface WaterfallRow {
  [key: string]: unknown;
  label: string;
  value?: number;
  total?: true;
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

/** Month by month: income, expense (negative), kept and the investment flows per slot. */
export function monthByMonthRows(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
  invest: Set<string>,
): MonthByMonthRow[] {
  const toRow = (slot: Slot): MonthByMonthRow => {
    const f = sumFlows(slot.txs, invest);
    return {
      date: slot.date,
      income: f.income,
      expense: f.spent === 0 ? 0 : -f.spent,
      kept: f.net,
      bought: f.bought,
      cashedOut: f.cashedOut,
      liquidity: f.liquidityLeft,
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

/**
 * Month by month y bound. With investments, the stacks count too (Earned + cashed out, Spent + bought).
 */
export function monthByMonthBound(
  rows: MonthByMonthRow[],
  withInvestments: boolean,
): number {
  return symmetricBound(
    rows.map((r) => ({
      ...r,
      income: (r.income ?? 0) + (withInvestments ? (r.cashedOut ?? 0) : 0),
      // Expense is stored negative, bought is positive: the stack magnitude is spent + bought.
      expense: (r.expense ?? 0) - (withInvestments ? (r.bought ?? 0) : 0),
    })),
  );
}
