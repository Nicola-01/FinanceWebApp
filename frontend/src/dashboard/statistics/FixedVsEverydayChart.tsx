import React, { useCallback, useMemo } from "react";
import {
  ComposedChart,
  ChartTooltip,
  Grid,
  SeriesBar,
  TooltipContent,
  XAxis,
  YAxis,
} from "@/components/ui/charts";
import { MONTH_LABELS } from "../../utils/months.ts";
import {
  compactAmount,
  formatKitAmount,
  type KitSeries,
} from "./kitChartData.ts";
import { KitLegend, KitNoData } from "./KitChartShared.tsx";
import type { FixedEverydayRow } from "./statsChartRows.ts";
import { useChartPalette } from "./useChartPalette.ts";

export interface FixedVsEverydayChartProps {
  rows: FixedEverydayRow[];
  byYear: boolean;
  currencySymbol: string;
}

const seriesOf = (subscription: string, expense: string): KitSeries[] => [
  { key: "subscriptions", label: "Subscriptions", color: subscription },
  { key: "everyday", label: "Everyday", color: expense },
];

/** Fixed vs everyday spending per month (or year): stacked bars, capped everyday bar. */
export const FixedVsEverydayChart: React.FC<FixedVsEverydayChartProps> = ({
  rows,
  byYear,
  currencySymbol,
}) => {
  const { subscription, expense, neutral } = useChartPalette();
  const series = useMemo(
    () => seriesOf(subscription, expense),
    [subscription, expense],
  );

  // A cut slot is called out in its tick label, e.g. "Oct 10k ↑".
  const tickLabels = useMemo(
    () =>
      rows.map((row) => {
        const label = byYear
          ? String(row.date.getFullYear())
          : MONTH_LABELS[row.date.getMonth()];
        return row.overflow ? `${label} ${row.overflow}` : label;
      }),
    [rows, byYear],
  );

  const tooltipLabels = useMemo(
    () =>
      rows.map((row) =>
        byYear
          ? String(row.date.getFullYear())
          : `${MONTH_LABELS[row.date.getMonth()]} ${row.date.getFullYear()}`,
      ),
    [rows, byYear],
  );

  // The real everyday value (not the capped bar) is shown, with the real total.
  const tooltipRows = useCallback(
    (point: Record<string, unknown>) => {
      const subs = Number(point.subscriptions);
      const everyday = Number(point.everyday);
      return [
        {
          color: subscription,
          label: "Subscriptions",
          value: formatKitAmount(subs, currencySymbol),
        },
        {
          color: expense,
          label: "Everyday",
          value: formatKitAmount(everyday, currencySymbol),
        },
        {
          color: neutral,
          label: "Total",
          value: formatKitAmount(subs + everyday, currencySymbol),
        },
      ];
    },
    [subscription, expense, neutral, currencySymbol],
  );

  const hasData = rows.some((row) => row.subscriptions + row.everyday !== 0);

  return (
    <section className="w-full p-5 max-sm:p-4 bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)]">
      <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
        Fixed vs everyday
      </h3>
      <p className="text-[13px] text-app-muted mt-0.5">
        Spending from subscriptions vs everything else.
      </p>
      {hasData ? (
        <>
          <ComposedChart
            data={rows}
            xDataKey="date"
            stacked
            aspectRatio="3 / 1"
            maxBarSize={32}
            margin={{ top: 16, right: 12, bottom: 28, left: 44 }}
            ariaLabel="Subscriptions and everyday spending per month"
          >
            <Grid horizontal />
            <SeriesBar
              dataKey="subscriptions"
              label="Subscriptions"
              fill={subscription}
            />
            <SeriesBar
              dataKey="everydayCapped"
              label="Everyday"
              fill={expense}
              radius={4}
            />
            <XAxis numTicks={rows.length} tickMode="data" labels={tickLabels} />
            <YAxis numTicks={3} formatValue={compactAmount} />
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
          <KitLegend series={series} />
        </>
      ) : (
        <KitNoData />
      )}
    </section>
  );
};
