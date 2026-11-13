import { format } from "date-fns";
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
