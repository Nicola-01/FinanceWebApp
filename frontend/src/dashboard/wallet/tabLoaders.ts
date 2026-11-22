import { useEffect } from "react";

// Code-split tab chunks (keeps the chart kit out of the main chunk). Each loader is
// shared by `lazy()` in WalletDashboard and by the idle prefetch below, so a click
// after prefetch resolves from the module cache with no fallback.
export const loadStatisticsTab = () =>
  import("../statistics/StatisticsTab").then((m) => ({
    default: m.StatisticsTab,
  }));
export const loadBudgetTab = () =>
  import("../budget/BudgetTab").then((m) => ({ default: m.BudgetTab }));
export const loadTagsTab = () =>
  import("../tag/TagsTab.tsx").then((m) => ({ default: m.TagsTab }));
export const loadSettingsTab = () =>
  import("../settings/SettingsTab.tsx").then((m) => ({
    default: m.SettingsTab,
  }));

export const TAB_LOADERS = [
  loadStatisticsTab,
  loadBudgetTab,
  loadTagsTab,
  loadSettingsTab,
];

/** Safari and some embedded webviews lack requestIdleCallback. */
const IDLE_FALLBACK_MS = 1500;

/** Set once the loaders have actually run; a cancelled schedule leaves it false. */
let prefetched = false;

/**
 * Runs the loaders on browser idle, once per app session. Returns a cancel
 * function, or undefined when the prefetch already ran.
 */
export function schedulePrefetch(
  loaders: Array<() => Promise<unknown>>,
): (() => void) | undefined {
  if (prefetched) return undefined;
  const run = () => {
    prefetched = true;
    // A failed prefetch is harmless: lazy() retries the import on click.
    loaders.forEach((load) => {
      load().catch(() => undefined);
    });
  };
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(run);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, IDLE_FALLBACK_MS);
  return () => window.clearTimeout(id);
}

/** Warms every lazy tab chunk once `ready` (wallet data loaded) turns true. */
export function usePrefetchTabs(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    return schedulePrefetch(TAB_LOADERS);
  }, [ready]);
}
