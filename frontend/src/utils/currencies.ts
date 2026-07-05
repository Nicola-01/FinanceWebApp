export type CurrencyCode =
  | "AUD"
  | "BRL"
  | "CAD"
  | "CHF"
  | "CNY"
  | "CZK"
  | "DKK"
  | "EUR"
  | "GBP"
  | "HKD"
  | "HUF"
  | "IDR"
  | "ILS"
  | "INR"
  | "ISK"
  | "JPY"
  | "KRW"
  | "MXN"
  | "MYR"
  | "NOK"
  | "NZD"
  | "PHP"
  | "PLN"
  | "RON"
  | "SEK"
  | "SGD"
  | "THB"
  | "TRY"
  | "USD"
  | "ZAR";

export type CurrencyMeta = {
  name: string;
  symbol: string;
  symbolNarrow?: string;
};

export const CURRENCY_META: Record<CurrencyCode, CurrencyMeta> = {
  AUD: { name: "Australian Dollar", symbol: "$", symbolNarrow: "A$" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  CAD: { name: "Canadian Dollar", symbol: "$", symbolNarrow: "C$" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CNY: { name: "Chinese Renminbi Yuan", symbol: "¥", symbolNarrow: "CN¥" },
  CZK: { name: "Czech Koruna", symbol: "Kč" },
  DKK: { name: "Danish Krone", symbol: "kr", symbolNarrow: "DKK" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  HKD: { name: "Hong Kong Dollar", symbol: "$", symbolNarrow: "HK$" },
  HUF: { name: "Hungarian Forint", symbol: "Ft" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
  ILS: { name: "Israeli New Shekel", symbol: "₪" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  ISK: { name: "Icelandic Króna", symbol: "kr", symbolNarrow: "ISK" },
  JPY: { name: "Japanese Yen", symbol: "¥", symbolNarrow: "JP¥" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  MXN: { name: "Mexican Peso", symbol: "$", symbolNarrow: "Mex$" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM" },
  NOK: { name: "Norwegian Krone", symbol: "kr", symbolNarrow: "NOK" },
  NZD: { name: "New Zealand Dollar", symbol: "$", symbolNarrow: "NZ$" },
  PHP: { name: "Philippine Peso", symbol: "₱" },
  PLN: { name: "Polish Złoty", symbol: "zł" },
  RON: { name: "Romanian Leu", symbol: "lei" },
  SEK: { name: "Swedish Krona", symbol: "kr", symbolNarrow: "SEK" },
  SGD: { name: "Singapore Dollar", symbol: "$", symbolNarrow: "S$" },
  THB: { name: "Thai Baht", symbol: "฿" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  USD: { name: "United States Dollar", symbol: "$", symbolNarrow: "$" },
  ZAR: { name: "South African Rand", symbol: "R" },
};

/**
 * Curated "main" currencies, shown first (in this priority order) in the
 * `CurrencySelector`. Every code here must exist in `CURRENCY_META`.
 */
export const MAIN_CURRENCY_CODES: readonly string[] = [
  "EUR",
  "USD",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "CNY",
];

/**
 * Full currency catalogue hydration, cached once per local day.
 *
 * The curated `CURRENCY_META` above only covers ~30 common currencies. The
 * selector's "Others" group needs the long tail, so we hydrate it at runtime
 * from Frankfurter **v2** `GET /v2/currencies` — an array of
 * `{ iso_code, name, symbol, … }`. Frankfurter's currency list and its
 * convertible set are identical (every listed currency has a rate), so there is
 * nothing to filter for convertibility. The response is memoised in
 * localStorage for the current local day (same pattern as `exchangeRates.ts`).
 */

const API_BASE = "https://api.frankfurter.dev/v2";
const CURRENCIES_CACHE_KEY = "fx_currencies";

/** One entry of the Frankfurter v2 `/currencies` array. */
interface FrankfurterCurrency {
  iso_code: string;
  name: string;
  symbol: string;
}

interface CachedCurrencies {
  /** Local calendar day the list was stored on (YYYY-MM-DD). */
  cachedOn: string;
  /** code → { name, symbol } straight from the API (curated meta re-applied on read). */
  data: Record<string, CurrencyMeta>;
}

/** Today's local date as YYYY-MM-DD (not UTC — matches the user's day). */
const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/** Curated meta wins over the API's (better narrow symbols / cleaner names). */
const mergeWithCurated = (
  api: Record<string, CurrencyMeta>,
): Record<string, CurrencyMeta> => ({ ...api, ...CURRENCY_META });

const readCurrenciesCache = (): Record<string, CurrencyMeta> | null => {
  try {
    const raw = localStorage.getItem(CURRENCIES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCurrencies;
    if (parsed.cachedOn !== todayKey()) return null; // stale (different day)
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCurrenciesCache = (data: Record<string, CurrencyMeta>): void => {
  try {
    const entry: CachedCurrencies = { cachedOn: todayKey(), data };
    localStorage.setItem(CURRENCIES_CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* storage unavailable / full — a missing cache just means we refetch */
  }
};

/**
 * The full currency catalogue (`code → { name, symbol }`), served from the
 * same-day localStorage cache when available and otherwise hydrated from
 * Frankfurter v2. Curated `CURRENCY_META` always wins over the API meta. On any
 * network/parse failure it degrades to the curated set alone, so the selector
 * still works offline.
 */
export const getCurrencies = async (): Promise<
  Record<string, CurrencyMeta>
> => {
  const cached = readCurrenciesCache();
  if (cached) return mergeWithCurated(cached);

  try {
    const res = await fetch(`${API_BASE}/currencies`);
    const data = (await res.json()) as FrankfurterCurrency[];
    if (Array.isArray(data) && data.length > 0) {
      const api: Record<string, CurrencyMeta> = {};
      for (const c of data) {
        if (c && c.iso_code) {
          api[c.iso_code] = { name: c.name, symbol: c.symbol };
        }
      }
      writeCurrenciesCache(api);
      return mergeWithCurated(api);
    }
  } catch {
    /* fall through to the curated-only set */
  }

  return { ...CURRENCY_META };
};

// --- Preferred ("starred") foreign currency, per wallet ---
//
// The currency to preselect when the user turns on "different currency" for a
// transaction/subscription. One per wallet; when unset the default is simply the
// wallet's own currency. Stored client-side (localStorage), like the fx cache.

const preferredKey = (walletId?: string): string =>
  `fx_default_currency_${walletId ?? "global"}`;

/** The wallet's starred default foreign currency, or `null` when none is set. */
export const getPreferredForeignCurrency = (
  walletId?: string,
): string | null => {
  try {
    return localStorage.getItem(preferredKey(walletId));
  } catch {
    return null;
  }
};

/** Star (`code`) or un-star (`null`) the wallet's default foreign currency. */
export const setPreferredForeignCurrency = (
  walletId: string | undefined,
  code: string | null,
): void => {
  try {
    if (code) localStorage.setItem(preferredKey(walletId), code);
    else localStorage.removeItem(preferredKey(walletId));
  } catch {
    /* storage unavailable — the preference just won't persist */
  }
};
