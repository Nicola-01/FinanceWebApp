import React, { useMemo } from "react";
import {
  ChartTooltip,
  ComposedChart,
  Grid,
  Line,
  SeriesBar,
  TooltipContent,
  XAxis,
  YAxis,
  curveMonotoneX,
} from "@/components/ui/charts";
import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";
import { useInvestmentTags } from "../wallet/useInvestmentTags.ts";
import { KitLegend } from "./KitChartShared.tsx";
import { StatCard } from "./StatCard.tsx";
import { compactAmount, formatKitAmount } from "./kitChartData.ts";
import { investmentsSeries } from "./investmentsData.ts";
import type { StatsPeriod } from "./statsPeriod.ts";

export interface InvestmentsWidgetProps {
  transactions: Transaction[];
  period: StatsPeriod;
  currencySymbol: string;
  /** Render without the card shell + heading (the parent group card provides them). */
  bare?: boolean;
}

const INVEST = "var(--color-app-invest)";
const INVEST_FADED =
  "color-mix(in srgb, var(--color-app-invest) 45%, transparent)";
const TEXT = "var(--color-app-text)";
const margin = { top: 6, right: 12, bottom: 28, left: 44 };

/** One step of the chart: the cashed-out bar is negated so it hangs below the line. */
type InvestRow = {
  date: Date;
  bought: number;
  cashedOut: number;
  cashedBelow: number;
  cumulative: number;
};

/** Bought bars up, cashed-out bars down (lighter), and a dashed running total. */
export const InvestmentsWidget: React.FC<InvestmentsWidgetProps> = ({
  transactions,
  period,
  currencySymbol,
  bare = false,
}) => {
  const invest = useInvestmentTags();
  const today = useMemo(() => new Date(), []);
  const series = useMemo(
    () => investmentsSeries(transactions, period, today, invest),
    [transactions, period, today, invest],
  );
  const { months, byTag, bought, cashedOut, net } = series;
  const maxNet = Math.max(1, ...byTag.map((t) => Math.abs(t.net)));

  const rows = useMemo<InvestRow[]>(
    () =>
      months.map((m) => ({
        date: m.date,
        bought: m.bought,
        cashedOut: m.cashedOut,
        cashedBelow: -m.cashedOut,
        cumulative: m.cumulative,
      })),
    [months],
  );
  // One symmetric bound for both axes, covering the bars and the running total (the line can outgrow the bars).
  const yDomains = useMemo(() => {
    const peak = Math.max(
      1,
      ...months.flatMap((m) => [m.bought, m.cashedOut, Math.abs(m.cumulative)]),
    );
    const bound = peak * 1.1;
    return {
      left: [-bound, bound] as [number, number],
      cashed: [-bound, bound] as [number, number],
    };
  }, [months]);
  const isAll = period.kind === "all";
  const titleOf = (date: Date) =>
    isAll
      ? String(date.getFullYear())
      : `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
  const tickLabels = months.map((m) =>
    isAll ? String(m.date.getFullYear()) : MONTH_LABELS[m.date.getMonth()],
  );
  const tooltipRows = (point: Record<string, unknown>) => {
    const p = point as InvestRow;
    return [
      {
        color: INVEST,
        label: "Bought",
        value: formatKitAmount(p.bought, currencySymbol),
      },
      {
        color: INVEST_FADED,
        label: "Cashed out",
        value: formatKitAmount(p.cashedOut, currencySymbol),
      },
      {
        color: TEXT,
        label: "Invested so far",
        value: formatKitAmount(p.cumulative, currencySymbol, true),
      },
    ];
  };
  const legend = [
    { key: "bought", label: "Bought", color: INVEST },
    { key: "cashedOut", label: "Cashed out", color: INVEST_FADED },
    { key: "cumulative", label: "Invested so far", color: TEXT },
  ];

  // Hidden when the period has no investment money at all.
  if (bought === 0 && cashedOut === 0) return null;

  return (
    <StatCard
      title="Investments"
      subtitle="What you put in, what came back, and where."
      bare={bare}
    >
      {/* The kit paints Line marks beneath SeriesBars, so the running total lives in the transparent overlay below. */}
      <div className="relative">
        <ComposedChart
          data={rows}
          xDataKey="date"
          stacked
          yDomains={yDomains}
          aspectRatio="5 / 2"
          margin={margin}
          maxBarSize={28}
          ariaLabel="Bought, cashed out and invested so far per period"
        >
          <Grid horizontal />
          <SeriesBar dataKey="bought" label="Bought" fill={INVEST} radius={4} />
          <SeriesBar
            dataKey="cashedBelow"
            label="Cashed out"
            fill={INVEST_FADED}
            radius={4}
            yAxisId="cashed"
          />
          <XAxis numTicks={months.length} tickMode="data" labels={tickLabels} />
          <YAxis numTicks={5} formatValue={compactAmount} />
          <ChartTooltip
            dateLabels={months.map((m) => titleOf(m.date))}
            rows={tooltipRows}
            content={({ point }) => (
              <TooltipContent
                title={titleOf(point.date as Date)}
                rows={tooltipRows(point)}
              />
            )}
          />
        </ComposedChart>
        {/* Transparent twin on the same geometry: its bars only match the layout; the running total draws on top. */}
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
            ariaLabel="Invested so far per period"
          >
            <SeriesBar dataKey="bought" fill="transparent" />
            <SeriesBar
              dataKey="cashedBelow"
              fill="transparent"
              yAxisId="cashed"
            />
            <Line
              dataKey="cumulative"
              label="Invested so far"
              stroke={TEXT}
              strokeWidth={1.8}
              curve={curveMonotoneX}
              showMarkers={false}
              // shortcut: the kit dashes only a tail from a data index, so the first segment stays solid.
              dashFromIndex={1}
            />
          </ComposedChart>
        </div>
      </div>

      <KitLegend series={legend} className="mt-0" />

      <div className="grid grid-cols-3 gap-3">
        <Fact value={formatKitAmount(bought, currencySymbol)} label="bought" />
        <Fact
          value={formatKitAmount(cashedOut, currencySymbol)}
          label="cashed out"
        />
        <Fact
          value={formatKitAmount(net, currencySymbol, true)}
          label="invested net"
          accent
        />
      </div>

      <ul className="flex flex-col gap-3 border-t border-app-border pt-4">
        {byTag.map((tag) => (
          <li
            key={tag.name}
            className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-[13px]"
          >
            <span className="truncate text-app-text">{tag.name}</span>
            <span className="h-2 rounded-full bg-app-input overflow-hidden">
              <span
                className="block h-full rounded-full bg-app-invest"
                style={{ width: `${(Math.abs(tag.net) / maxNet) * 100}%` }}
              />
            </span>
            <span className="text-app-text tabular-nums">
              {formatKitAmount(tag.net, currencySymbol, true)}
            </span>
          </li>
        ))}
      </ul>
    </StatCard>
  );
};

const Fact: React.FC<{ value: string; label: string; accent?: boolean }> = ({
  value,
  label,
  accent = false,
}) => (
  <div className="flex flex-col">
    <b
      className={`font-display text-[15px] font-semibold tabular-nums ${accent ? "text-app-invest" : "text-app-text"}`}
    >
      {value}
    </b>
    <span className="text-[12px] text-app-muted">{label}</span>
  </div>
);
