import React, { useMemo, useId } from "react";
import { ChartDataProviderPro } from "@mui/x-charts-pro/ChartDataProviderPro";
import { ChartsSurface } from "@mui/x-charts-pro/ChartsSurface";
import { ChartsXAxis } from "@mui/x-charts-pro/ChartsXAxis";
import { ChartsYAxis } from "@mui/x-charts-pro/ChartsYAxis";
import { ChartsTooltip } from "@mui/x-charts-pro/ChartsTooltip";
import { ChartsGrid } from "@mui/x-charts-pro/ChartsGrid";
import { ChartZoomSlider } from "@mui/x-charts-pro/ChartZoomSlider";
import { ChartsClipPath } from "@mui/x-charts-pro/ChartsClipPath";
import { ChartsAxisHighlight } from "@mui/x-charts/ChartsAxisHighlight";
import { ThemeProvider } from "@mui/material/styles";
import type { ZoomData } from "@mui/x-charts/internals";
import type { AllSeriesType } from "@mui/x-charts/models";
import type { Transaction } from "../../types/domain.ts";
import { useTheme } from "../../utils/ThemeContext.tsx";
import {
  buildMonthlyBuckets,
  type MonthlyBucket,
  type MonthlyChartRow,
} from "./chartData";
import { darkTheme, lightTheme, tooltipSx } from "./chartTheme.ts";

export type MonthlyChartSeries = AllSeriesType[];

export interface MonthlyChartProps {
  transactions: Transaction[];
  zoomData?: readonly ZoomData[];
  onZoomChange?: (zoomData: ZoomData[]) => void;
}

interface MonthlyChartShapeProps {
  /** Pure, module-level shaper (kept stable so the dataset memo holds). */
  buildRows: (buckets: MonthlyBucket[]) => MonthlyChartRow[];
  series: MonthlyChartSeries;
  /** Plot layers rendered inside the clip path. */
  plots: React.ReactNode;
  axisHighlight: "line" | "band";
  legend: { label: string; color: string }[];
  swatchClassName: string;
}

/**
 * Shared surface for the monthly statistics charts: zoomable band x-axis,
 * grid, tooltip and legend. Each chart supplies its dataset shaper, series
 * and plot layers.
 */
export const MonthlyChart: React.FC<
  MonthlyChartProps & MonthlyChartShapeProps
> = ({
  transactions,
  zoomData,
  onZoomChange,
  buildRows,
  series,
  plots,
  axisHighlight,
  legend,
  swatchClassName,
}) => {
  const { resolvedTheme } = useTheme();
  const clipPathId = useId();

  const dataset = useMemo(
    () => buildRows(buildMonthlyBuckets(transactions)),
    [transactions, buildRows],
  );

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
        series={series}
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
              fill: "var(--color-app-muted)",
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
          <g clipPath={`url(#${clipPathId})`}>{plots}</g>
          <ChartsXAxis axisId="x-axis" />
          <ChartsYAxis axisId="y-axis" />
          <ChartsAxisHighlight x={axisHighlight} />
          <ChartZoomSlider />
        </ChartsSurface>
        <ChartsTooltip sx={tooltipSx(resolvedTheme === "dark")} />
      </ChartDataProviderPro>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={swatchClassName}
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-app-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </ThemeProvider>
  );
};
