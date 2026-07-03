import React, { useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import type { Transaction } from "../../utils/types.ts";
import { Selector } from "../../components/ui/Selector.tsx";
import {
  OTHER_COLOR,
  buildMainCategoryMeta,
  mainCategoryName,
} from "./categoryAgg.ts";

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

const TOP_N = 6;

const formatAmount = (value: number): string =>
  value.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type FlowType = "EXPENSE" | "INCOME";

interface TrendSeries {
  dataKey: string;
  label: string;
  color: string;
}

/**
 * Builds a per-month stacked dataset: for the given flow type, the top-N main categories become
 * their own stacked series (coloured by the category), everything else collapses into "Other".
 * Category keys are opaque ids (s0, s1, …) so a category named like a reserved field can't clash.
 */
function buildTrend(
  transactions: Transaction[],
  type: FlowType,
): { dataset: Record<string, number | string>[]; series: TrendSeries[] } {
  const txs = transactions.filter((t) => t.type === type);
  if (txs.length === 0) return { dataset: [], series: [] };

  const meta = buildMainCategoryMeta(txs);
  const months = new Map<string, { date: Date; perCat: Map<string, number> }>();
  const catTotals = new Map<string, number>();

  txs.forEach((tx) => {
    const d = new Date(tx.transactionDate);
    const mKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months.has(mKey)) {
      months.set(mKey, {
        date: new Date(d.getFullYear(), d.getMonth(), 1),
        perCat: new Map(),
      });
    }
    const main = mainCategoryName(tx);
    const bucket = months.get(mKey)!;
    bucket.perCat.set(main, (bucket.perCat.get(main) ?? 0) + tx.amount);
    catTotals.set(main, (catTotals.get(main) ?? 0) + tx.amount);
  });

  const topCats = Array.from(catTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([name]) => name);
  const topIndex = new Map(topCats.map((name, i) => [name, i]));
  const hasOther = catTotals.size > topCats.length;

  const sortedMonths = Array.from(months.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const dataset = sortedMonths.map((m) => {
    const row: Record<string, number | string> = {
      period: `${MONTH_LABELS[m.date.getMonth()]} ${m.date.getFullYear()}`,
    };
    topCats.forEach((_, i) => (row[`s${i}`] = 0));
    if (hasOther) row.sOther = 0;
    m.perCat.forEach((value, cat) => {
      const i = topIndex.get(cat);
      if (i !== undefined) row[`s${i}`] = (row[`s${i}`] as number) + value;
      else if (hasOther) row.sOther = (row.sOther as number) + value;
    });
    return row;
  });

  const series: TrendSeries[] = topCats.map((name, i) => ({
    dataKey: `s${i}`,
    label: name,
    color: meta.get(name)?.color ?? OTHER_COLOR,
  }));
  if (hasOther)
    series.push({ dataKey: "sOther", label: "Other", color: OTHER_COLOR });

  return { dataset, series };
}

interface CategoryTrendChartProps {
  transactions: Transaction[];
  /** Currency symbol shown in the tooltip (e.g. "€"). */
  currency: string;
}

/**
 * Stacked-by-month view of how each top category evolves over time, with an Income/Expense
 * toggle. Free `@mui/x-charts` BarChart; colours come from the categories.
 */
export const CategoryTrendChart: React.FC<CategoryTrendChartProps> = ({
  transactions,
  currency,
}) => {
  const [type, setType] = useState<FlowType>("EXPENSE");

  const { dataset, series } = useMemo(
    () => buildTrend(transactions, type),
    [transactions, type],
  );

  return (
    <div className="flex flex-col w-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border p-4 md:p-6 text-app-text">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-app-text uppercase tracking-wider">
            Category Trend
          </h3>
          <p className="text-sm text-app-muted">
            Top categories per month, stacked over time.
          </p>
        </div>
        <Selector
          value={type}
          onChange={setType}
          size="sm"
          fullWidth={false}
          className="w-[180px]"
          options={[
            {
              value: "INCOME",
              label: "Income",
              activeColorClass: "text-app-text",
            },
            {
              value: "EXPENSE",
              label: "Expenses",
              activeColorClass: "text-app-text",
            },
          ]}
        />
      </div>

      {dataset.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center min-h-[300px] bg-app-input/30 rounded-xl border border-app-border border-dashed">
          <p className="text-app-muted">No data available.</p>
        </div>
      ) : (
        <>
          <BarChart
            dataset={dataset}
            height={360}
            margin={{ top: 10, right: 10, bottom: 24, left: 10 }}
            xAxis={[
              {
                scaleType: "band",
                dataKey: "period",
                tickLabelStyle: {
                  fill: "var(--color-app-muted)",
                  fontSize: 11,
                },
              },
            ]}
            yAxis={[
              {
                tickLabelStyle: {
                  fill: "var(--color-app-muted)",
                  fontSize: 11,
                },
              },
            ]}
            series={series.map((s) => ({
              ...s,
              stack: "total",
              valueFormatter: (v: number | null) =>
                v == null ? "" : `${formatAmount(v)} ${currency}`,
            }))}
            hideLegend
          />

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {series.map((s) => (
              <div key={s.dataKey} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-app-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
