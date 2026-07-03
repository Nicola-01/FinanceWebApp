import React, { useMemo, useId } from "react";
import { ChartDataProviderPro } from "@mui/x-charts-pro/ChartDataProviderPro";
import { ChartsSurface } from "@mui/x-charts-pro/ChartsSurface";
import { LinePlot } from "@mui/x-charts-pro/LineChart";
import { ChartsXAxis } from "@mui/x-charts-pro/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts-pro/ChartsYAxis";
import { ChartsTooltip } from "@mui/x-charts-pro/ChartsTooltip";
import { ChartsGrid } from "@mui/x-charts-pro/ChartsGrid";
import { ChartZoomSlider } from "@mui/x-charts-pro/ChartZoomSlider";
import { ChartsClipPath } from "@mui/x-charts-pro/ChartsClipPath";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { Transaction } from "../../utils/types.ts";
import { useTheme } from "../../utils/ThemeContext.tsx";
import { buildMonthlyBuckets } from "./chartData";
import type { ZoomData } from "@mui/x-charts/internals";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const lightTheme = createTheme({
  palette: { mode: "light", background: { paper: "transparent" } },
});

const darkTheme = createTheme({
  palette: { mode: "dark", background: { paper: "transparent" } },
});

// Series colours (soft tints that read well as lines on the chart surface).
// Shared by the plotted series and the legend swatches so the two always match.
const INCOME_COLOR = "#34d399";
const EXPENSE_COLOR = "#f87171";
const BALANCE_COLOR = "#60a5fa";

interface CumulativeChartProps {
  transactions: Transaction[];
  zoomData?: readonly ZoomData[];
  onZoomChange?: (zoomData: ZoomData[]) => void;
}

export const CumulativeChart: React.FC<CumulativeChartProps> = ({
  transactions,
  zoomData,
  onZoomChange,
}) => {
  const { resolvedTheme } = useTheme();
  const clipPathId = useId();

  const buckets = useMemo(
    () => buildMonthlyBuckets(transactions),
    [transactions],
  );

  const labels = useMemo(
    () =>
      buckets.map((b) => {
        const m = MONTH_LABELS[b.date.getMonth()];
        const y = b.date.getFullYear();
        return `${m} ${y}`;
      }),
    [buckets],
  );

  // Cumulative always starts from the very beginning so that
  // zooming into recent months still shows the accumulated totals.
  const dataset = useMemo(() => {
    let cumIncome = 0;
    let cumExpense = 0;
    const rows = [];
    for (let i = 0; i < buckets.length; i++) {
      cumIncome += buckets[i].income;
      cumExpense += buckets[i].expense;
      rows.push({
        label: labels[i],
        income: cumIncome,
        expense: cumExpense,
        balance: cumIncome - cumExpense,
      });
    }
    return rows;
  }, [buckets, labels]);

  if (dataset.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-app-muted">
        No data available.
      </div>
    );
  }

  return (
    <ThemeProvider theme={resolvedTheme === "dark" ? darkTheme : lightTheme}>
      <ChartDataProviderPro
        height={420}
        dataset={dataset}
        series={[
          {
            type: "line",
            dataKey: "income",
            label: "Cumulative Income",
            color: INCOME_COLOR,
            curve: "monotoneX",
            showMark: false,
            valueFormatter: (v) => (v == null ? "" : `+${v.toFixed(2)}`),
          },
          {
            type: "line",
            dataKey: "expense",
            label: "Cumulative Expenses",
            color: EXPENSE_COLOR,
            curve: "monotoneX",
            showMark: false,
            valueFormatter: (v) => (v == null ? "" : `-${v.toFixed(2)}`),
          },
          {
            type: "line",
            dataKey: "balance",
            label: "Net Balance",
            color: BALANCE_COLOR,
            curve: "monotoneX",
            showMark: false,
            valueFormatter: (v) =>
              v == null ? "" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}`,
          },
        ]}
        xAxis={[
          {
            id: "x-axis",
            scaleType: "band",
            dataKey: "label",
            zoom: { slider: { enabled: true }, minSpan: 5, panning: true },
          },
        ]}
        yAxis={[
          {
            id: "y-axis",
            tickLabelStyle: {
              fill:
                resolvedTheme === "dark"
                  ? "var(--color-app-muted)"
                  : "var(--color-app-muted)",
              fontSize: 11,
            },
          },
        ]}
        initialZoom={zoomData ?? [{ axisId: "x-axis", start: 0, end: 100 }]}
        onZoomChange={onZoomChange}
      >
        <ChartsSurface>
          <ChartsClipPath id={clipPathId} />
          <ChartsGrid horizontal />
          <g clipPath={`url(#${clipPathId})`}>
            <LinePlot />
          </g>
          <ChartsXAxis axisId="x-axis" />
          <ChartsYAxis axisId="y-axis" />
          <ChartsAxisHighlight x="line" />
          <ChartZoomSlider />
        </ChartsSurface>
        <ChartsTooltip
          sx={{
            "& .MuiChartsTooltip-paper": {
              backgroundColor:
                resolvedTheme === "dark"
                  ? "var(--color-app-hover)"
                  : "var(--color-app-hover)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border:
                resolvedTheme === "dark"
                  ? "1px solid #ffffff20"
                  : "1px solid #00000010",
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
            },
          }}
        />
      </ChartDataProviderPro>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-1 rounded-full"
            style={{ backgroundColor: INCOME_COLOR }}
          />
          <span className="text-xs text-app-muted">Cum. Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-1 rounded-full"
            style={{ backgroundColor: EXPENSE_COLOR }}
          />
          <span className="text-xs text-app-muted">Cum. Expenses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-1 rounded-full"
            style={{ backgroundColor: BALANCE_COLOR }}
          />
          <span className="text-xs text-app-muted">Net Balance</span>
        </div>
      </div>
    </ThemeProvider>
  );
};
