import React, { useMemo } from "react";
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
import { compactAmount, formatKitAmount } from "./kitChartData.ts";
import { KitLegend, KitNoData } from "./KitChartShared.tsx";
import { symmetricBound, type MonthByMonthRow } from "./statsChartRows.ts";
import { useChartPalette } from "./useChartPalette.ts";

export interface MonthByMonthChartProps {
  rows: MonthByMonthRow[];
  byYear: boolean;
  currencySymbol: string;
}

const hasAmount = (row: MonthByMonthRow) =>
  !!(row.income || row.expense || row.kept);

const margin = { top: 16, right: 12, bottom: 28, left: 44 };

/** Earned bars above the line, spent bars below it, and a kept dot per period. */
export const MonthByMonthChart: React.FC<MonthByMonthChartProps> = ({
  rows,
  byYear,
  currencySymbol,
}) => {
  const { income, expense, kept } = useChartPalette();
  const bound = symmetricBound(rows);
  // Each bar sits alone on its own axis: non-stacked bars would otherwise grow from the domain minimum.
  const yDomains = useMemo(
    () => ({
      left: [-bound, bound] as [number, number],
      spent: [-bound, bound] as [number, number],
    }),
    [bound],
  );
  const tickLabels = useMemo(
    () =>
      rows.map((r) =>
        byYear ? String(r.date.getFullYear()) : MONTH_LABELS[r.date.getMonth()],
      ),
    [rows, byYear],
  );
  const tooltipLabels = useMemo(
    () =>
      rows.map((r) =>
        byYear
          ? String(r.date.getFullYear())
          : `${MONTH_LABELS[r.date.getMonth()]} ${r.date.getFullYear()}`,
      ),
    [rows, byYear],
  );
  const tooltipRows = useMemo(
    () => (point: Record<string, unknown>) => {
      const p = point as MonthByMonthRow;
      return [
        ...(p.income !== undefined
          ? [
              {
                color: income,
                label: "Earned",
                value: formatKitAmount(p.income, currencySymbol),
              },
            ]
          : []),
        ...(p.expense !== undefined
          ? [
              {
                color: expense,
                label: "Spent",
                value: formatKitAmount(Math.abs(p.expense), currencySymbol),
              },
            ]
          : []),
        ...(p.kept !== undefined
          ? [
              {
                color: kept,
                label: "Kept",
                value: formatKitAmount(p.kept, currencySymbol, true),
              },
            ]
          : []),
      ];
    },
    [income, expense, kept, currencySymbol],
  );

  const title = byYear ? "Year by year" : "Month by month";
  const sub =
    "Earned above the line, spent below it. The dot is what you kept.";
  const series = useMemo(
    () => [
      { key: "income", label: "Earned", color: income },
      { key: "expense", label: "Spent", color: expense },
      { key: "kept", label: "Kept", color: kept },
    ],
    [income, expense, kept],
  );

  return (
    <section className="bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 max-sm:p-4">
      <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
        {title}
      </h3>
      <p className="text-[13px] text-app-muted mt-0.5">{sub}</p>
      {rows.some(hasAmount) ? (
        <>
          <div className="relative">
            {/* The kit paints Line marks beneath SeriesBars, so the Kept line and dots live in the overlay below. */}
            <ComposedChart
              data={rows}
              xDataKey="date"
              stacked
              yDomains={yDomains}
              aspectRatio="5 / 2"
              margin={margin}
              maxBarSize={28}
              ariaLabel="Earned, spent and kept per month"
            >
              <Grid horizontal />
              <SeriesBar
                dataKey="income"
                label="Earned"
                fill={income}
                radius={4}
              />
              <SeriesBar
                dataKey="expense"
                label="Spent"
                fill={expense}
                radius={4}
                yAxisId="spent"
              />
              <XAxis
                numTicks={rows.length}
                tickMode="data"
                labels={tickLabels}
              />
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
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
            >
              <ComposedChart
                data={rows}
                xDataKey="date"
                stacked
                yDomains={yDomains}
                aspectRatio="5 / 2"
                margin={margin}
                maxBarSize={28}
                ariaLabel="Kept per month"
              >
                <SeriesBar dataKey="income" fill="transparent" />
                <SeriesBar
                  dataKey="expense"
                  fill="transparent"
                  yAxisId="spent"
                />
                <Line
                  dataKey="kept"
                  label="Kept"
                  stroke={kept}
                  strokeWidth={2}
                  curve={curveMonotoneX}
                  showMarkers={false}
                />
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
          <KitLegend series={series} />
        </>
      ) : (
        <KitNoData />
      )}
    </section>
  );
};
