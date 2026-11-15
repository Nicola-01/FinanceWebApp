import type { Tag, Transaction } from "../../types/domain.ts";
import { OTHER_COLOR, mainCategoryName } from "./categoryAgg.ts";

export interface StripCategory {
  name: string;
  color: string;
  /** Share of the period's total expenses, rounded to a whole percent. */
  percent: number;
}

/**
 * The top-level categories that had spending in the period, largest first. Expenses only,
 * grouped the way the charts group them. Empty when nothing was spent.
 */
export function rankExpenseCategories(
  transactions: Transaction[],
  tags: Tag[],
): StripCategory[] {
  const totals = new Map<string, number>();
  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== "EXPENSE") continue;
    const main = mainCategoryName(tx);
    totals.set(main, (totals.get(main) ?? 0) + tx.amount);
    total += tx.amount;
  }
  if (total <= 0) return [];

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      color:
        tags.find((t) => t.name === name && !t.parentName)?.colorHex ??
        OTHER_COLOR,
      percent: Math.round((value / total) * 100),
    }));
}
