/**
 * Frankfurter exchange-rate access, cached once per local day.
 *
 * Frankfurter rates are published ~once a day (ECB reference rates), so there is
 * no point hitting the network more than once per currency pair per day. We use
 * the **v2** API:
 *   GET /v2/rates?base=B&quotes=Q  →  [{ date, base, quote, rate }]
 * and memoise the result in localStorage keyed by the pair, valid for the
 * current local calendar day.
 */

const API_BASE = "https://api.frankfurter.dev/v2";

export interface FxRate {
  /** base → quote conversion rate. */
  rate: number;
  /** ECB reference date the rate belongs to (YYYY-MM-DD). */
  date: string;
}

interface CachedFxRate extends FxRate {
  /** Local calendar day the entry was stored on (YYYY-MM-DD). */
  cachedOn: string;
}

/** Today's local date as YYYY-MM-DD (not UTC — matches the user's day). */
const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const cacheKey = (base: string, quote: string): string =>
  `fx_rate_${base}_${quote}`;

const readCache = (base: string, quote: string): FxRate | null => {
  try {
    const raw = localStorage.getItem(cacheKey(base, quote));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFxRate;
    if (parsed.cachedOn !== todayKey()) return null; // stale (different day)
    return { rate: parsed.rate, date: parsed.date };
  } catch {
    return null;
  }
};

const writeCache = (base: string, quote: string, fx: FxRate): void => {
  try {
    const entry: CachedFxRate = { ...fx, cachedOn: todayKey() };
    localStorage.setItem(cacheKey(base, quote), JSON.stringify(entry));
  } catch {
    /* storage unavailable / full — a missing cache just means we refetch */
  }
};

/**
 * Get the `base → quote` rate, served from the same-day cache when available
 * and otherwise fetched from Frankfurter v2 (and cached). Returns `null` when
 * the rate can't be determined (bad response); throws only on network failure.
 */
export const getExchangeRate = async (
  base: string,
  quote: string,
): Promise<FxRate | null> => {
  if (base === quote) return { rate: 1, date: todayKey() };

  const cached = readCache(base, quote);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/rates?base=${base}&quotes=${quote}`);
  const data = await res.json();

  // v2 shape: an array of { date, base, quote, rate }.
  const row = Array.isArray(data) ? data[0] : null;
  if (row && typeof row.rate === "number") {
    const fx: FxRate = { rate: row.rate, date: row.date };
    writeCache(base, quote, fx);
    return fx;
  }

  return null;
};
