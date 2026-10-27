import React from "react";
import { LinePlot } from "@mui/x-charts-pro/LineChart";
import { toCumulativeRows } from "./chartData";
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
    type: "line",
    dataKey: "income",
    label: "Cumulative Income",
    color: INCOME_COLOR,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatIncome,
  },
  {
    type: "line",
    dataKey: "expense",
    label: "Cumulative Expenses",
    color: EXPENSE_COLOR,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatExpense,
  },
  {
    type: "line",
    dataKey: "balance",
    label: "Net Balance",
    color: BALANCE_COLOR,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatBalance,
  },
];

const LEGEND = [
  { label: "Cum. Income", color: INCOME_COLOR },
  { label: "Cum. Expenses", color: EXPENSE_COLOR },
  { label: "Net Balance", color: BALANCE_COLOR },
];

export const CumulativeChart: React.FC<MonthlyChartProps> = (props) => (
  <MonthlyChart
    {...props}
    buildRows={toCumulativeRows}
    series={SERIES}
    plots={<LinePlot />}
    axisHighlight="line"
    legend={LEGEND}
    swatchClassName="w-3 h-1 rounded-full"
  />
);
