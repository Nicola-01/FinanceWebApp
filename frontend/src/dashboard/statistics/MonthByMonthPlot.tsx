import React from "react";
import {
  ChartTooltip,
  ComposedChart,
  Grid,
  Line,
  Scatter,
  SeriesBar,
  TooltipContent,
  XAxis,
  YAxis,
  curveMonotoneX,
} from "@/components/ui/charts";
import { MONTH_LABELS } from "../../utils/months.ts";
import { compactAmount } from "./kitChartData.ts";
import type { MonthByMonthRow } from "./statsChartRows.ts";
import { useChartPalette } from "./useChartPalette.ts";

export const INVEST_COLOR = "var(--color-app-invest)";

const margin = { top: 16, right: 12, bottom: 28, left: 44 };

export interface MonthByMonthPlotProps {
  /** Plain rows: the transparent overlay and the x axis read these. */
  rows: MonthByMonthRow[];
  /** What the base chart draws: plain rows, or rows carrying `boughtBelow` when investments show. */
  data: MonthByMonthRow[];
  showInvestments: boolean;
  yDomains: Record<"left" | "spent", [number, number]>;
  byYear: boolean;
  tickLabels: string[];
  tooltipLabels: string[];
  tooltipRows: NonNullable<React.ComponentProps<typeof ChartTooltip>["rows"]>;
  /** Entrance duration in ms; undefined keeps the kit default. */
  animationDuration?: number;
}

/** The main ComposedChart plus its transparent Kept overlay, on the same geometry. */
export const MonthByMonthPlot: React.FC<MonthByMonthPlotProps> = ({
  rows,
  data,
  showInvestments,
  yDomains,
  byYear,
  tickLabels,
  tooltipLabels,
  tooltipRows,
  animationDuration,
}) => {
  const { income, expense, kept } = useChartPalette();
  return (
    <div className="relative">
      {/* The kit paints Line marks beneath SeriesBars, so the Kept line and dots live in the overlay below. */}
      <ComposedChart
        data={data}
        xDataKey="date"
        stacked
        yDomains={yDomains}
        aspectRatio="5 / 2"
        margin={margin}
        maxBarSize={28}
        animationDuration={animationDuration}
        ariaLabel="Earned, spent and kept per month"
      >
        <Grid horizontal />
        <SeriesBar dataKey="income" label="Earned" fill={income} radius={4} />
        {showInvestments && (
          <SeriesBar
            dataKey="cashedOut"
            label="Cashed out"
            fill={INVEST_COLOR}
            radius={4}
          />
        )}
        <SeriesBar
          dataKey="expense"
          label="Spent"
          fill={expense}
          radius={4}
          yAxisId="spent"
        />
        {showInvestments && (
          <SeriesBar
            dataKey="boughtBelow"
            label="Bought"
            fill={INVEST_COLOR}
            radius={4}
            yAxisId="spent"
          />
        )}
        <XAxis numTicks={rows.length} tickMode="data" labels={tickLabels} />
        <YAxis numTicks={5} formatValue={compactAmount} />
        <ChartTooltip
          dateLabels={tooltipLabels}
          rows={tooltipRows}
          content={({ point }) => {
            const d = point.date as Date;
            return (
              <TooltipContent
                title={
                  byYear
                    ? String(d.getFullYear())
                    : `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`
                }
                rows={tooltipRows(point)}
              />
            );
          }}
        />
      </ComposedChart>
      {/* Transparent twin on the same geometry: its bars only match the x inset; the Kept line and dots draw on top. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <ComposedChart
          data={rows}
          xDataKey="date"
          stacked
          yDomains={yDomains}
          aspectRatio="5 / 2"
          margin={margin}
          maxBarSize={28}
          animationDuration={animationDuration}
          ariaLabel="Kept per month"
        >
          <SeriesBar dataKey="income" fill="transparent" />
          {showInvestments && (
            <SeriesBar dataKey="cashedOut" fill="transparent" />
          )}
          <SeriesBar dataKey="expense" fill="transparent" yAxisId="spent" />
          {showInvestments && (
            <SeriesBar
              dataKey="boughtBelow"
              fill="transparent"
              yAxisId="spent"
            />
          )}
          <Line
            dataKey="kept"
            label="Kept"
            stroke={kept}
            strokeWidth={2}
            curve={curveMonotoneX}
            showMarkers={false}
          />
          {showInvestments && (
            <Line
              dataKey="liquidity"
              label="Liquidity left"
              stroke={kept}
              strokeWidth={2}
              curve={curveMonotoneX}
              showMarkers={false}
              // shortcut: the kit dashes only a tail from a data index, so the first Jan-Feb segment stays solid.
              dashFromIndex={1}
            />
          )}
          <Scatter
            dataKey="kept"
            label="Kept"
            fill={kept}
            stroke={kept}
            strokeWidth={0}
            ringGap={0}
            radius={4}
          />
        </ComposedChart>
      </div>
    </div>
  );
};
