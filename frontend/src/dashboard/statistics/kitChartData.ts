import { formatAmount } from "../../utils/format.ts";
import {
  CURRENCY_META,
  type CurrencyCode,
} from "../../utils/currencies/meta.ts";
import { MONTH_LABELS } from "../../utils/months.ts";

/** A plotted series in a kit chart: its row field, legend label and colour. */
export interface KitSeries {
  key: string;
  label: string;
  color: string;
  /** Prefix "+" / "−" in the tooltip (the balance). */
  signed?: boolean;
}

/** Axis label: 950, 15k, 1.2M (one decimal below 10, whole numbers above). */
export function compactAmount(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const scaled = (n: number, unit: string) =>
    `${sign}${(n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toString()}${unit}`;
  if (abs >= 1_000_000) return scaled(abs / 1_000_000, "M");
  if (abs >= 1_000) return scaled(abs / 1_000, "k");
  return `${sign}${Math.round(abs)}`;
}

/**
 * Tooltip amount: the wallet currency symbol then the grouped value. `signed`
 * prefixes "+" / "−" for the balance; income and expenses are plain amounts.
 */
export function formatKitAmount(
  value: number,
  symbol: string,
  signed = false,
): string {
  const prefix = signed && value !== 0 ? (value > 0 ? "+" : "−") : "";
  return `${prefix}${formatAmount(Math.abs(value))} ${symbol}`;
}

/** Currency symbol for a wallet code; falls back to the code itself. */
export const currencySymbolOf = (code: string): string =>
  CURRENCY_META[code as CurrencyCode]?.symbol ?? code;

/** Month name for the x axis, from the bucket date. */
export const monthLabel = (date: Date): string => MONTH_LABELS[date.getMonth()];
