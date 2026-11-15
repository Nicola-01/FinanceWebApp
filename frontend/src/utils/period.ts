import { eachDayOfInterval, format, min, parseISO, startOfDay } from "date-fns";
import type {
  DateRangeValue,
  PresetType,
} from "../components/datePicker/datePresets";
import type { Transaction } from "../types/domain";

/** "October 2026" for a month, "2026" for a year; "" for the other presets. */
export function periodLabel(
  range: DateRangeValue,
  preset: PresetType,
  today: Date = new Date(),
): string {
  const base = range.start ?? today;
  if (preset === "month") return format(base, "MMMM yyyy");
  if (preset === "year") return format(base, "yyyy");
  return "";
}

/** Income and expense totals (amounts are positive; `type` carries the sign). */
export function sumByType(transactions: Transaction[]): {
  income: number;
  expense: number;
} {
  return transactions.reduce(
    (acc, tx) => {
      if (tx.type === "INCOME") acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
}

/** Running net (income − expense) at the end of each day of the period, one row per day; [] if the period has no bounds and no transactions. */
export function dailyNetSeries(
  transactions: Transaction[],
  start: Date | null,
  end: Date | null,
): { date: Date; v: number }[] {
  const today = startOfDay(new Date());
  const earliest = transactions.reduce<string | null>(
    (least, tx) =>
      least === null || tx.transactionDate < least ? tx.transactionDate : least,
    null,
  );
  const from = start ? startOfDay(start) : earliest ? parseISO(earliest) : null;
  const to = end ? min([startOfDay(end), today]) : today;
  if (!from || from > to) return [];

  const delta = new Map<string, number>();
  for (const tx of transactions) {
    const signed = tx.type === "INCOME" ? tx.amount : -tx.amount;
    delta.set(
      tx.transactionDate,
      (delta.get(tx.transactionDate) ?? 0) + signed,
    );
  }
  // Transactions dated before the first day still count towards the running total.
  const fromKey = format(from, "yyyy-MM-dd");
  let running = 0;
  for (const [key, amount] of delta) if (key < fromKey) running += amount;

  return eachDayOfInterval({ start: from, end: to }).map((date) => {
    running += delta.get(format(date, "yyyy-MM-dd")) ?? 0;
    // Round to cents so float drift cannot turn a settled zero into a non-zero trend.
    return { date, v: Math.round(running * 100) / 100 };
  });
}
