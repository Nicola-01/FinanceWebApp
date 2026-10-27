import React, { useMemo, useState } from "react";
import { BarChartPro } from "@mui/x-charts-pro/BarChartPro";
import type { Transaction } from "../../types/domain.ts";
import { buildTrend, type FlowType } from "./categoryChartData.ts";
import { useRecentMonthsZoom } from "./useRecentMonthsZoom.ts";
import { formatAmount } from "../../utils/format.ts";
import { ChartCard } from "./ChartCard.tsx";
import { FlowTypeToggle } from "./FlowTypeToggle.tsx";

interface CategoryTrendChartProps {
  transactions: Transaction[];
  /** Currency symbol shown in the tooltip (e.g. "€"). */
  currency: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}

/**
 * Stacked-by-month view of how each top category evolves over time, with an Income/Expense
 * toggle. Free `@mui/x-charts` BarChart; colours come from the categories.
 */
export const CategoryTrendChart: React.FC<CategoryTrendChartProps> = ({
  transactions,
  currency,
  bare = false,
}) => {
  const [type, setType] = useState<FlowType>("EXPENSE");

  const { dataset, series } = useMemo(
    () => buildTrend(transactions, type),
    [transactions, type],
  );

  const periods = useMemo(
    () => dataset.map((row) => String(row.period)),
    [dataset],
  );
  const [zoomData, setZoomData] = useRecentMonthsZoom(periods);

  return (
    <ChartCard
      title="Category Trend"
      subtitle="Top categories per month, stacked over time."
      bare={bare}
      controls={<FlowTypeToggle value={type} onChange={setType} />}
      isEmpty={dataset.length === 0}
      emptyMinHeightClass="min-h-[300px]"
    >
      <BarChartPro
        dataset={dataset}
        height={360}
        margin={{ top: 10, right: 10, bottom: 24, left: 10 }}
        zoomData={zoomData}
        onZoomChange={setZoomData}
        xAxis={[
          {
            id: "x-axis",
            scaleType: "band",
            dataKey: "period",
            zoom: { slider: { enabled: true }, minSpan: 5, panning: true },
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
    </ChartCard>
  );
};
