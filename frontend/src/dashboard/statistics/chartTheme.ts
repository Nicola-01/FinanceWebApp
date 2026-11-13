import { createTheme } from "@mui/material/styles";

/** Transparent-paper MUI themes for the statistics charts. */
export const lightTheme = createTheme({
  palette: { mode: "light", background: { paper: "transparent" } },
});

export const darkTheme = createTheme({
  palette: { mode: "dark", background: { paper: "transparent" } },
});

// Series colours (soft tints that read well on the chart surface).
// Shared by the plotted series and the legend swatches so the two always match.
export const INCOME_COLOR = "#34d399";
export const EXPENSE_COLOR = "#f87171";
export const BALANCE_COLOR = "#60a5fa";

/** Tooltip value formatters: income always "+", expense always "-", balance signed. */
export const formatIncome = (v: number | null): string =>
  v == null ? "" : `+${v.toFixed(2)}`;
export const formatExpense = (v: number | null): string =>
  v == null ? "" : `-${v.toFixed(2)}`;
export const formatBalance = (v: number | null): string =>
  v == null ? "" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

/** `sx` for the glassy tooltip paper. */
export const tooltipSx = (isDark: boolean) => ({
  "& .MuiChartsTooltip-paper": {
    backgroundColor: "var(--color-app-hover)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: isDark ? "1px solid #ffffff20" : "1px solid #00000010",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
  },
});

/** Chart colours for the v2 theme, as CSS colour strings. */
export interface ChartColors {
  income: string;
  expense: string;
  balance: string;
  /** Recessive grid lines (v2 only). */
  grid: string;
  /** Axis labels (v2 only). */
  axis: string;
  /** Warning mark. */
  warn: string;
  /** Danger mark. */
  danger: string;
  /** Darker expense shade for stacked "subscriptions" bars. */
  subscription: string;
  /** Muted grey for totals. */
  neutral: string;
  /** Kept (balance) series in the month-by-month chart. */
  kept: string;
}

// shortcut: fallback only for jsdom / pre-CSS renders; the live values come from the tokens.
const V2_FALLBACK: Record<string, string> = {
  "--v2-kept": "52 120 198",
  "--v2-income": "47 143 85",
  "--v2-expense-mark": "236 138 118",
  "--text-primary": "28 26 23",
  "--border-primary": "228 225 220",
  "--text-faint": "154 149 140",
  "--v2-warn-fill": "240 160 32",
  "--v2-danger": "196 65 47",
  "--text-muted": "120 113 108",
};

/**
 * Resolves the v2 chart colours from the theme-tokens rgb triplets. SVG
 * attributes do not resolve `var()`, so the values are read as real colours.
 */
export function resolveV2ChartColors(
  readVar: (name: string) => string,
): ChartColors {
  const triplet = (name: string) => readVar(name) || V2_FALLBACK[name];
  // Darker expense shade: each channel scaled by 0.78.
  const subscription = triplet("--v2-expense-mark")
    .split(/\s+/)
    .map((c) => Math.round(Number(c) * 0.78))
    .join(" ");
  return {
    income: `rgb(${triplet("--v2-income")})`,
    expense: `rgb(${triplet("--v2-expense-mark")})`,
    balance: `rgb(${triplet("--text-primary")} / 0.6)`,
    grid: `rgb(${triplet("--border-primary")})`,
    axis: `rgb(${triplet("--text-faint")})`,
    warn: `rgb(${triplet("--v2-warn-fill")})`,
    danger: `rgb(${triplet("--v2-danger")})`,
    subscription: `rgb(${subscription})`,
    neutral: `rgb(${triplet("--text-muted")})`,
    kept: `rgb(${triplet("--v2-kept")})`,
  };
}

/** `sx` for the v2 tooltip: surface card (r-input) with the hairline ring and a floating shadow. */
export const tooltipSxV2 = {
  "& .MuiChartsTooltip-paper": {
    backgroundColor: "var(--color-app-card)",
    backdropFilter: "none",
    border: "none",
    borderRadius: "var(--r-input)",
    boxShadow: "0 8px 24px rgb(0 0 0 / 0.25), var(--box-ring)",
  },
};

/** `sx` for the v2 recessive horizontal grid. */
export const gridSxV2 = (grid: string) => ({
  "& .MuiChartsGrid-line": { stroke: grid },
});
