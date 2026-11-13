import React, { useMemo } from "react";
import { BarPlot } from "@mui/x-charts-pro/BarChart";
import { LinePlot } from "@mui/x-charts-pro/LineChart";
import { toSnapshotRows } from "./chartData";
import { formatBalance, formatExpense, formatIncome } from "./chartTheme.ts";
import { useChartPalette } from "./useChartPalette.ts";
import {
  MonthlyChart,
  type MonthlyChartProps,
  type MonthlyChartSeries,
} from "./MonthlyChart.tsx";

const snapshotSeries = (c: {
  income: string;
  expense: string;
  balance: string;
}): MonthlyChartSeries => [
  {
    type: "bar",
    dataKey: "income",
    label: "Income",
    color: c.income,
    valueFormatter: formatIncome,
  },
  {
    type: "bar",
    dataKey: "expense",
    label: "Expenses",
    color: c.expense,
    valueFormatter: formatExpense,
  },
  {
    type: "line",
    dataKey: "balance",
    label: "Balance",
    color: c.balance,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatBalance,
  },
];

export const MonthlySnapshotChart: React.FC<MonthlyChartProps> = (props) => {
  const palette = useChartPalette();
  const { income, expense, balance, isV2 } = palette;
  const series = useMemo(
    () => snapshotSeries({ income, expense, balance }),
    [income, expense, balance],
  );
  return (
    <MonthlyChart
      {...props}
      buildRows={toSnapshotRows}
      series={series}
      plots={
        <>
          {/* ui-v2-switch: 4px rounded bar tops */}
          <BarPlot borderRadius={isV2 ? 4 : undefined} />
          <LinePlot />
        </>
      }
      axisHighlight="band"
      legend={[
        { label: "Income", color: income },
        { label: "Expenses", color: expense },
        { label: "Balance", color: balance },
      ]}
      swatchClassName="w-3 h-3 rounded-sm"
    />
  );
};
