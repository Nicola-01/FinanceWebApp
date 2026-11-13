import React, { useEffect, useMemo, useRef, useState } from "react";
import { BarChartPro } from "@mui/x-charts-pro/BarChartPro";
import type { Transaction } from "../../types/domain.ts";
import { buildTrend, type FlowType } from "./categoryChartData.ts";
import { useRecentMonthsZoom } from "./useRecentMonthsZoom.ts";
import { formatAmount } from "../../utils/format.ts";
import { ChartCard } from "./ChartCard.tsx";
import { FlowTypeToggle } from "./FlowTypeToggle.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import {
  V2_AXIS,
  V2_GRID_SX,
  V2_ZOOM_MIN_MONTHS,
  V2_ZOOM_SLIDER_SX,
  categoryGapForMaxBar,
  formatCompactAxis,
} from "./chartStyleV2.ts";
import { tooltipSxV2 } from "../statistics/chartTheme.ts";

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
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
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

  // ui-v2-switch: plot width drives the bar-width cap for few months.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapWidth, setWrapWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!v2 || !el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) =>
      setWrapWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [v2]);

  const fewMonths = periods.length < V2_ZOOM_MIN_MONTHS;
  const PLOT_MARGIN_X = 20;
  const chart = (
    <BarChartPro
      dataset={dataset}
      height={360}
      margin={{ top: 10, right: 10, bottom: 24, left: 10 }}
      // ui-v2-switch: 4px rounded stack tops (MUI rounds only the top segment),
      // recessive dashed grid, 1px card-coloured seams between segments.
      borderRadius={v2 ? 4 : undefined}
      grid={v2 ? { horizontal: true } : undefined}
      sx={
        v2
          ? {
              ...V2_GRID_SX,
              "& .MuiBarElement-root": {
                stroke: "var(--color-app-card)",
                strokeWidth: 1.5,
              },
              ...(fewMonths ? {} : V2_ZOOM_SLIDER_SX),
            }
          : undefined
      }
      zoomData={zoomData}
      onZoomChange={setZoomData}
      xAxis={[
        {
          id: "x-axis",
          scaleType: "band",
          dataKey: "period",
          zoom: {
            slider: { enabled: !(v2 && fewMonths) },
            minSpan: 5,
            panning: true,
          },
          tickLabelStyle: {
            fill: "var(--color-app-muted)",
            fontSize: 11,
          },
          ...(v2 // ui-v2-switch
            ? {
                ...V2_AXIS,
                categoryGapRatio: fewMonths
                  ? categoryGapForMaxBar(
                      wrapWidth - PLOT_MARGIN_X,
                      periods.length,
                    )
                  : 0.2,
              }
            : {}),
        },
      ]}
      yAxis={[
        {
          tickLabelStyle: {
            fill: "var(--color-app-muted)",
            fontSize: 11,
          },
          ...(v2 ? { ...V2_AXIS, valueFormatter: formatCompactAxis } : {}), // ui-v2-switch
        },
      ]}
      series={series.map((s) => ({
        ...s,
        stack: "total",
        ...(v2 ? { labelMarkType: "circle" as const } : {}), // ui-v2-switch
        valueFormatter: (v: number | null) =>
          v == null ? "" : `${formatAmount(v)} ${currency}`,
      }))}
      slotProps={v2 ? { tooltip: { sx: tooltipSxV2 } } : undefined}
      hideLegend
    />
  );

  return (
    <ChartCard
      title="Category Trend"
      subtitle="Top categories per month, stacked over time."
      bare={bare}
      controls={<FlowTypeToggle value={type} onChange={setType} />}
      isEmpty={dataset.length === 0}
      emptyMinHeightClass="min-h-[300px]"
    >
      {v2 ? <div ref={wrapRef}>{chart}</div> : chart}
      {/* ui-v2-switch */}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {series.map((s) => (
          <div key={s.dataKey} className="flex items-center gap-1.5">
            <span
              className={
                v2 // ui-v2-switch
                  ? "w-2 h-2 rounded-full shrink-0"
                  : "w-3 h-3 rounded-sm shrink-0"
              }
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs text-app-muted">{s.label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
};
