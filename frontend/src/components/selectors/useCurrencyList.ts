import { useState, useEffect, useMemo } from "react";
import {
  CURRENCY_META,
  MAIN_CURRENCY_CODES,
  getCurrencies,
  type CurrencyCode,
  type CurrencyMeta,
} from "../../utils/currencies";

const MAIN_SET = new Set(MAIN_CURRENCY_CODES);

/**
 * Builds the two sections (main / others), or a single flat filtered list
 * (`results`) while searching. `results` is null when the query is blank.
 */
export function buildCurrencyLists(
  meta: Record<string, CurrencyMeta>,
  excludeCurrency: string | undefined,
  query: string,
) {
  const exclude = excludeCurrency?.toUpperCase();
  const main = MAIN_CURRENCY_CODES.filter((c) => meta[c] && c !== exclude);
  const others = Object.keys(meta)
    .filter((c) => !MAIN_SET.has(c) && c !== exclude)
    .sort();

  const q = query.trim().toLowerCase();
  if (!q) return { mainCodes: main, otherCodes: others, results: null };

  const match = (c: string) =>
    c.toLowerCase().includes(q) ||
    (meta[c]?.name.toLowerCase().includes(q) ?? false);
  // Main currencies rank first, then Others — both in their display order.
  const flat = [...main, ...others].filter(match);
  return { mainCodes: main, otherCodes: others, results: flat };
}

/**
 * Currency metadata + the visible lists of CurrencySelector. Starts with the
 * curated set (instant), then hydrates the long tail on open.
 */
export function useCurrencyList({
  isOpen,
  safeCode,
  excludeCurrency,
  query,
}: {
  isOpen: boolean;
  safeCode: CurrencyCode;
  excludeCurrency?: string;
  query: string;
}) {
  const [meta, setMeta] = useState<Record<string, CurrencyMeta>>(CURRENCY_META);
  const [hydrated, setHydrated] = useState(false);

  const { mainCodes, otherCodes, results } = useMemo(
    () => buildCurrencyLists(meta, excludeCurrency, query),
    [meta, excludeCurrency, query],
  );

  // Flat, ordered list of every code currently visible (keyboard nav order).
  const visibleCodes = useMemo(
    () => (results ? results : [...mainCodes, ...otherCodes]),
    [results, mainCodes, otherCodes],
  );

  // Hydrate the long list from Frankfurter (cached daily) on first open — or
  // eagerly on mount if the current value isn't in the curated set, so a
  // foreign-currency wallet shows its name in the closed trigger.
  useEffect(() => {
    if (hydrated) return;
    const selectedIsCurated = Boolean(CURRENCY_META[safeCode]);
    if (!isOpen && selectedIsCurated) return;
    let alive = true;
    getCurrencies().then((full) => {
      if (alive) {
        setMeta(full);
        setHydrated(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [isOpen, hydrated, safeCode]);

  return { meta, mainCodes, otherCodes, results, visibleCodes };
}
