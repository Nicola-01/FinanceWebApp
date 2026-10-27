import React, { useMemo, useState } from "react";
import { Heatmap } from "@mui/x-charts-pro/Heatmap";
import { ChartZoomSlider } from "@mui/x-charts-pro/ChartZoomSlider";
import type { Transaction } from "../../types/domain.ts";
import { buildHeatmap, type FlowType } from "./categoryChartData.ts";
import { useRecentMonthsZoom } from "./useRecentMonthsZoom.ts";
import { formatAmount } from "../../utils/format.ts";
import { ChartCard } from "./ChartCard.tsx";
import { FlowTypeToggle } from "./FlowTypeToggle.tsx";

// Soft sequential scales (low-alpha tint → soft 400 tint), per flow type.
const COLOR_SCALE: Record<FlowType, readonly [string, string]> = {
  EXPENSE: ["rgba(248,113,113,0.10)", "#f87171"],
  INCOME: ["rgba(52,211,153,0.10)", "#34d399"],
};

interface CategoryHeatmapChartProps {
  transactions: Transaction[];
  /** Currency symbol shown in the tooltip (e.g. "€"). */
  currency: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}

/**
 * A categories × months heatmap: intensity = amount spent/earned per category per month.
 * Reveals seasonality and where the money concentrates over time. Pro `@mui/x-charts-pro`.
 */
export const CategoryHeatmapChart: React.FC<CategoryHeatmapChartProps> = ({
  transactions,
  currency,
  bare = false,
}) => {
  const [type, setType] = useState<FlowType>("EXPENSE");

  const { xLabels, yLabels, cells, maxValue } = useMemo(
    () => buildHeatmap(transactions, type),
    [transactions, type],
  );

  const [zoomData, setZoomData] = useRecentMonthsZoom(xLabels);

  // Extra bottom room reserves space for the x-axis labels + zoom slider.
  const height = Math.max(280, yLabels.length * 44 + 130);

  return (
    <ChartCard
      title="Category Heatmap"
      subtitle="Where the money concentrates, by category and month."
      bare={bare}
      controls={<FlowTypeToggle value={type} onChange={setType} expenseFirst />}
      isEmpty={cells.length === 0}
      emptyMinHeightClass="min-h-[240px]"
    >
      <div className="w-full">
        <Heatmap
          height={height}
          zoomData={zoomData}
          onZoomChange={setZoomData}
          xAxis={[
            {
              id: "x-axis",
              data: xLabels,
              zoom: { slider: { enabled: true }, minSpan: 5, panning: true },
              tickLabelStyle: {
                fill: "var(--color-app-muted)",
                fontSize: 11,
              },
            },
          ]}
          yAxis={[
            {
              data: yLabels,
              tickLabelStyle: {
                fill: "var(--color-app-muted)",
                fontSize: 11,
              },
            },
          ]}
          zAxis={[
            {
              min: 0,
              max: maxValue,
              colorMap: {
                type: "continuous",
                min: 0,
                max: maxValue,
                color: COLOR_SCALE[type],
              },
            },
          ]}
          series={[
            {
              data: cells,
              valueFormatter: (v) => `${formatAmount(v[2])} ${currency}`,
            },
          ]}
        >
          <ChartZoomSlider />
        </Heatmap>
      </div>
    </ChartCard>
  );
};
