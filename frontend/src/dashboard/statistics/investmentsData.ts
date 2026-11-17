import type { Transaction } from "../../types/domain.ts";
import { isInvestmentTx } from "../../utils/investments.ts";
import {
  availableYears,
  txYearMonth,
  type StatsPeriod,
} from "./statsPeriod.ts";

export interface InvestmentMonth {
  /** Month start (year view) or January 1st (all-time view, one step per year). */
  date: Date;
  bought: number;
  cashedOut: number;
  /** Running invested net up to and including this step. */
  cumulative: number;
}

export interface InvestmentsSeries {
  months: InvestmentMonth[];
  /** Invested net per investment tag, largest first. */
  byTag: { name: string; net: number }[];
  bought: number;
  cashedOut: number;
  /** Bought − cashed out; negative when more was cashed out than bought. */
  net: number;
}

/** Last month index (0-based) that has a step in a year; -1 for a future year. */
function lastMonthOf(year: number, today: Date): number {
  if (year < today.getFullYear()) return 11;
  if (year === today.getFullYear()) return today.getMonth();
  return -1;
}

/**
 * Investment money per step of the period: bought (EXPENSE on investment tags),
 * cashed out (INCOME on them), their running net and a per-tag net. Steps match
 * the other Statistics charts: months of a year up to today, years for all-time.
 * Transactions dated after the last step are left out, as the bars are.
 */
export function investmentsSeries(
  txs: Transaction[],
  period: StatsPeriod,
  today: Date,
  invest: Set<string>,
): InvestmentsSeries {
  const years = period.kind === "all" ? availableYears(txs) : [];
  const firstYear = years.length ? years[years.length - 1] : 0;
  const dates =
    period.kind === "all"
      ? Array.from(
          { length: years.length ? years[0] - firstYear + 1 : 0 },
          (_, i) => new Date(firstYear + i, 0, 1),
        )
      : Array.from(
          { length: lastMonthOf(period.year, today) + 1 },
          (_, m) => new Date(period.year, m, 1),
        );
  const months: InvestmentMonth[] = dates.map((date) => ({
    date,
    bought: 0,
    cashedOut: 0,
    cumulative: 0,
  }));

  const netByTag = new Map<string, number>();
  for (const tx of txs) {
    if (!isInvestmentTx(tx, invest)) continue;
    const { year, month } = txYearMonth(tx);
    if (period.kind === "year" && year !== period.year) continue;
    const step = period.kind === "all" ? year - firstYear : month;
    const slot = months[step];
    if (!slot) continue;
    if (tx.type === "EXPENSE") slot.bought += tx.amount;
    else slot.cashedOut += tx.amount;
    netByTag.set(
      tx.tag.name,
      (netByTag.get(tx.tag.name) ?? 0) +
        (tx.type === "EXPENSE" ? tx.amount : -tx.amount),
    );
  }

  let running = 0;
  for (const slot of months) {
    running += slot.bought - slot.cashedOut;
    slot.cumulative = running;
  }

  const bought = months.reduce((sum, m) => sum + m.bought, 0);
  const cashedOut = months.reduce((sum, m) => sum + m.cashedOut, 0);
  return {
    months,
    byTag: [...netByTag]
      .map(([name, net]) => ({ name, net }))
      .sort((a, b) => b.net - a.net),
    bought,
    cashedOut,
    net: bought - cashedOut,
  };
}
