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
