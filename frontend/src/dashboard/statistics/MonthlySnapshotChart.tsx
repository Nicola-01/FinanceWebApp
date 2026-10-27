import React from "react";
import { BarPlot } from "@mui/x-charts-pro/BarChart";
import { LinePlot } from "@mui/x-charts-pro/LineChart";
import { toSnapshotRows } from "./chartData";
import {
  BALANCE_COLOR,
  EXPENSE_COLOR,
  INCOME_COLOR,
  formatBalance,
  formatExpense,
  formatIncome,
} from "./chartTheme.ts";
import {
  MonthlyChart,
  type MonthlyChartProps,
  type MonthlyChartSeries,
} from "./MonthlyChart.tsx";

const SERIES: MonthlyChartSeries = [
  {
    type: "bar",
    dataKey: "income",
    label: "Income",
    color: INCOME_COLOR,
    valueFormatter: formatIncome,
  },
  {
    type: "bar",
    dataKey: "expense",
    label: "Expenses",
    color: EXPENSE_COLOR,
    valueFormatter: formatExpense,
  },
  {
    type: "line",
    dataKey: "balance",
    label: "Balance",
    color: BALANCE_COLOR,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatBalance,
  },
];

const LEGEND = [
  { label: "Income", color: INCOME_COLOR },
  { label: "Expenses", color: EXPENSE_COLOR },
  { label: "Balance", color: BALANCE_COLOR },
];

export const MonthlySnapshotChart: React.FC<MonthlyChartProps> = (props) => (
  <MonthlyChart
    {...props}
    buildRows={toSnapshotRows}
    series={SERIES}
    plots={
      <>
        <BarPlot />
        <LinePlot />
      </>
    }
    axisHighlight="band"
    legend={LEGEND}
    swatchClassName="w-3 h-3 rounded-sm"
  />
);
