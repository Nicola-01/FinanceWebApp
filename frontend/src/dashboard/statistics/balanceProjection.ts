export interface ProjectionRow {
  [key: string]: unknown;
  date: Date; // first day of the month, local time
  balance?: number; // real running balance (history rows + the last real row)
  projected?: number; // projection (also set on the last real row so the dashed line starts there)
  low?: number; // band lower edge
  high?: number; // band upper edge
}

export interface BalanceProjection {
  rows: ProjectionRow[];
  pace: number; // median monthly net used
  end: number; // projected balance at the horizon
  endLow: number;
  endHigh: number;
  endDate: Date;
}

export type ProjectionHorizon = "eoy" | "1y" | "3y" | "5y";

const MAX_NETS = 12;
const BAND_Z = 1.28;
const MAD_TO_SIGMA = 1.4826;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * history: real end-of-month balances, oldest first, with the date of each month (first day).
 * horizonMonths: months to project after the last history month (>= 1).
 * Returns null when there are fewer than 3 history months.
 */
export function projectBalance(
  history: { date: Date; balance: number }[],
  horizonMonths: number,
): BalanceProjection | null {
  if (history.length < 3) return null;

  const nets: number[] = [];
  for (let i = 1; i < history.length; i++) {
    nets.push(history[i].balance - history[i - 1].balance);
  }
  const recent = nets.slice(-MAX_NETS);

  // Median, not mean: one outlier month (a big one-off purchase) must not skew the pace.
  const pace = median(recent);
  const mad = median(recent.map((n) => Math.abs(n - pace)));
  let sigma = mad * MAD_TO_SIGMA;
  if (sigma === 0) sigma = 0.1 * Math.abs(pace);

  const last = history[history.length - 1];
  const rows: ProjectionRow[] = history.map((h) => ({
    date: h.date,
    balance: h.balance,
  }));
  const lastRow = rows[rows.length - 1];
  lastRow.projected = last.balance;
  lastRow.low = last.balance;
  lastRow.high = last.balance;

  const year = last.date.getFullYear();
  const month = last.date.getMonth();
  let end = last.balance;
  let endLow = last.balance;
  let endHigh = last.balance;
  let endDate = last.date;

  for (let k = 1; k <= horizonMonths; k++) {
    const projected = last.balance + pace * k;
    const band = BAND_Z * sigma * Math.sqrt(k);
    endDate = new Date(year, month + k, 1);
    end = projected;
    endLow = projected - band;
    endHigh = projected + band;
    rows.push({ date: endDate, projected, low: endLow, high: endHigh });
  }

  return { rows, pace, end, endLow, endHigh, endDate };
}

/** Months from the last history month to the horizon choice. "eoy" = to December of that month's year (min 1). */
export function horizonMonths(
  lastHistoryDate: Date,
  horizon: ProjectionHorizon,
): number {
  switch (horizon) {
    case "eoy":
      return Math.max(1, 11 - lastHistoryDate.getMonth());
    case "1y":
      return 12;
    case "3y":
      return 36;
    case "5y":
      return 60;
  }
}
