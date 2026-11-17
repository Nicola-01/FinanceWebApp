import React, { useMemo, useState } from "react";
import Toggle from "../../components/ui/Toggle.tsx";
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
  /** Render without the card shell + heading (the parent group card provides them). */
  bare?: boolean;
}

const INVEST_KEY = "statistics.monthByMonth.showInvestments";
const INVEST_COLOR = "var(--color-app-invest)";

/** Row with the investment segments ready to stack: bought is drawn below Spent, so negative. */
type ChartRow = MonthByMonthRow & { boughtBelow?: number };

/** The Investments chip's on/off state, remembered on this device. */
function useShowInvestments(): [boolean, (next: boolean) => void] {
  const [on, setOn] = useState(
    () => localStorage.getItem(INVEST_KEY) === "true",
  );
  const set = (next: boolean) => {
    setOn(next);
    localStorage.setItem(INVEST_KEY, String(next));
  };
  return [on, set];
}

const hasAmount = (row: MonthByMonthRow, invest: boolean) =>
  !!(
    row.income ||
    row.expense ||
    row.kept ||
    (invest && (row.bought || row.cashedOut))
  );

const margin = { top: 16, right: 12, bottom: 28, left: 44 };

/** Earned bars above the line, spent bars below it, and a kept dot per period. */
export const MonthByMonthChart: React.FC<MonthByMonthChartProps> = ({
  rows,
  byYear,
  currencySymbol,
  bare = false,
}) => {
  const { income, expense, kept } = useChartPalette();
  const [showInvestments, setShowInvestments] = useShowInvestments();
  const data = useMemo<ChartRow[]>(
    () =>
      showInvestments
        ? rows.map((r) => ({ ...r, boughtBelow: -(r.bought ?? 0) }))
        : rows,
    [rows, showInvestments],
  );
  // The bound must cover the stacks: Earned + cashed out, and Spent + bought.
  const bound = useMemo(
    () =>
      symmetricBound(
        showInvestments
          ? data.map((r) => ({
              ...r,
              income: (r.income ?? 0) + (r.cashedOut ?? 0),
              expense: (r.expense ?? 0) + (r.boughtBelow ?? 0),
            }))
          : rows,
      ),
    [data, rows, showInvestments],
  );
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
      ...(showInvestments
        ? [
            {
              key: "invested",
              label: "Invested (out ↓ · back ↑)",
              color: INVEST_COLOR,
            },
          ]
        : []),
      { key: "kept", label: "Kept", color: kept },
    ],
    [income, expense, kept, showInvestments],
  );

  return (
    <section
      className={
        bare
          ? ""
          : "bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 max-sm:p-4"
      }
    >
      {!bare && (
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
              {title}
            </h3>
            <p className="text-[13px] text-app-muted mt-0.5">{sub}</p>
          </div>
          <Toggle
            variant="button"
            checked={showInvestments}
            onChange={setShowInvestments}
            label="↗ Investments"
          />
        </div>
      )}
      {rows.some((r) => hasAmount(r, showInvestments)) ? (
        <>
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
              ariaLabel="Earned, spent and kept per month"
            >
              <Grid horizontal />
              <SeriesBar
                dataKey="income"
                label="Earned"
                fill={income}
                radius={4}
              />
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
                {showInvestments && (
                  <SeriesBar dataKey="cashedOut" fill="transparent" />
                )}
                <SeriesBar
                  dataKey="expense"
                  fill="transparent"
                  yAxisId="spent"
                />
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
          <KitLegend series={series} />
          {showInvestments && (
            <div className="flex justify-center mt-1">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="w-3.5 border-t-2 border-dashed"
                  style={{ borderColor: kept }}
                />
                <span className="text-[13px] text-app-muted">
                  Liquidity left
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <KitNoData />
      )}
    </section>
  );
};
