import { useMemo } from "react";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import { useTheme } from "../../utils/ThemeContext.tsx";
import {
  BALANCE_COLOR,
  EXPENSE_COLOR,
  INCOME_COLOR,
  resolveV2ChartColors,
  type ChartColors,
} from "./chartTheme.ts";

export interface ChartPalette extends ChartColors {
  isV2: boolean;
}

const readCssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Series colours for the statistics charts: the v1 constants, or the v2 tokens
 * read at render. Recomputed when the resolved scheme flips, since the v2 tokens
 * differ between light and dark.
 */
export function useChartPalette(): ChartPalette {
  const [ui] = useUiVersion();
  const { resolvedTheme } = useTheme();
  return useMemo<ChartPalette>(() => {
    if (ui === "v2") return { isV2: true, ...resolveV2ChartColors(readCssVar) };
    return {
      isV2: false,
      income: INCOME_COLOR,
      expense: EXPENSE_COLOR,
      balance: BALANCE_COLOR,
      grid: "",
      axis: "",
      warn: "#f0a020",
      danger: EXPENSE_COLOR,
      subscription: EXPENSE_COLOR,
      neutral: "#9ca3af",
      kept: "#3b82f6",
    };
    // resolvedTheme is not read here; it keys the memo so the tokens re-read on a flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui, resolvedTheme]);
}
