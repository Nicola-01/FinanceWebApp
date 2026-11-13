import React, { useMemo } from "react";
import { LinePlot } from "@mui/x-charts-pro/LineChart";
import { toCumulativeRows } from "./chartData";
import { formatBalance, formatExpense, formatIncome } from "./chartTheme.ts";
import { useChartPalette } from "./useChartPalette.ts";
import {
  MonthlyChart,
  type MonthlyChartProps,
  type MonthlyChartSeries,
} from "./MonthlyChart.tsx";

const cumulativeSeries = (c: {
  income: string;
  expense: string;
  balance: string;
}): MonthlyChartSeries => [
  {
    type: "line",
    dataKey: "income",
    label: "Cumulative Income",
    color: c.income,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatIncome,
  },
  {
    type: "line",
    dataKey: "expense",
    label: "Cumulative Expenses",
    color: c.expense,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatExpense,
  },
  {
    type: "line",
    dataKey: "balance",
    label: "Net Balance",
    color: c.balance,
    curve: "monotoneX",
    showMark: false,
    valueFormatter: formatBalance,
  },
];

export const CumulativeChart: React.FC<MonthlyChartProps> = (props) => {
  const { income, expense, balance } = useChartPalette();
  const series = useMemo(
    () => cumulativeSeries({ income, expense, balance }),
    [income, expense, balance],
  );
  return (
    <MonthlyChart
      {...props}
      buildRows={toCumulativeRows}
      series={series}
      plots={<LinePlot />}
      axisHighlight="line"
      legend={[
        { label: "Cum. Income", color: income },
        { label: "Cum. Expenses", color: expense },
        { label: "Net Balance", color: balance },
      ]}
      swatchClassName="w-3 h-1 rounded-full"
    />
  );
};
