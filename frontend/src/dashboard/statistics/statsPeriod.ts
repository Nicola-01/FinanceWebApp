import type { Transaction } from "../../types/domain.ts";

export type StatsPeriod = { kind: "year"; year: number } | { kind: "all" };

/** Parses the "YYYY-MM" prefix of transactionDate; month is 0-based. */
export function txYearMonth(tx: Transaction): { year: number; month: number } {
  // Slicing the string avoids new Date(iso), which shifts dates across timezones.
  return {
    year: Number(tx.transactionDate.slice(0, 4)),
    month: Number(tx.transactionDate.slice(5, 7)) - 1,
  };
}

/** Distinct years that have transactions, descending. [] for no transactions. */
export function availableYears(txs: Transaction[]): number[] {
  const years = new Set(txs.map((tx) => txYearMonth(tx).year));
  return [...years].sort((a, b) => b - a);
}

/** year → only that calendar year's transactions; all → txs unchanged (same array is fine). */
export function filterByPeriod(
  txs: Transaction[],
  period: StatsPeriod,
): Transaction[] {
  if (period.kind === "all") return txs;
  return txs.filter((tx) => txYearMonth(tx).year === period.year);
}

/** year → { kind: "year", year: year - 1 }; all → null. */
export function previousPeriod(period: StatsPeriod): StatsPeriod | null {
  if (period.kind === "all") return null;
  return { kind: "year", year: period.year - 1 };
}

/** The default period: current year of `today`. */
export function defaultPeriod(today: Date): StatsPeriod {
  return { kind: "year", year: today.getFullYear() };
}

/** Selector label: "2026" or "All time". */
export function periodLabel(period: StatsPeriod): string {
  return period.kind === "all" ? "All time" : String(period.year);
}
