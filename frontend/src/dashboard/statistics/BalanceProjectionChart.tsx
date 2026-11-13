import { useMemo, useState } from "react";
import {
  Band,
  ChartTooltip,
  Grid,
  Line,
  LineChart,
  TooltipContent,
  XAxis,
  YAxis,
  curveMonotoneX,
} from "@/components/ui/charts";
import { Selector } from "../../components/ui/Selector.tsx";
import { MONTH_LABELS } from "../../utils/months.ts";
import {
  horizonMonths,
  projectBalance,
  type ProjectionHorizon,
  type ProjectionRow,
} from "./balanceProjection.ts";
import { compactAmount } from "./kitChartData.ts";
import { KitLegend } from "./KitChartShared.tsx";
import { useChartPalette } from "./useChartPalette.ts";

interface BalanceProjectionChartProps {
  /** End-of-month balances, oldest first; `date` is the 1st of the month. */
  history: { date: Date; balance: number }[];
  currencySymbol: string;
}

const HORIZON_OPTIONS: { value: ProjectionHorizon; label: string }[] = [
  { value: "eoy", label: "End of year" },
  { value: "1y", label: "1 year" },
  { value: "3y", label: "3 years" },
  { value: "5y", label: "5 years" },
];

/** Months of real history shown before the projection starts. */
const SHOWN_HISTORY_MONTHS = 12;

const monthYear = (d: Date) =>
  `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;

export const BalanceProjectionChart = ({
  history,
  currencySymbol,
}: BalanceProjectionChartProps) => {
  const { warn } = useChartPalette();
  const [horizon, setHorizon] = useState<ProjectionHorizon>("1y");

  const lastHistory = history[history.length - 1];
  const projection = useMemo(
    () =>
      lastHistory
        ? projectBalance(history, horizonMonths(lastHistory.date, horizon))
        : null,
    [history, lastHistory, horizon],
  );

  // Hooks sit above the early return. One series over every row: `value` is the real balance, then the projection.
  const rows = useMemo(
    () =>
      projection?.rows.slice(
        Math.max(0, history.length - SHOWN_HISTORY_MONTHS),
      ) ?? [],
    [projection, history.length],
  );
  const chartRows = useMemo(
    () => rows.map((r) => ({ ...r, value: r.balance ?? r.projected })),
    [rows],
  );
  const lastRealIndex = chartRows.findLastIndex((r) => r.balance !== undefined);

  if (!lastHistory || !projection) return null;

  const whole = (v: number) =>
    `${Math.round(v).toLocaleString("it-IT")} ${currencySymbol}`;
  const signedPace = `${projection.pace < 0 ? "−" : "+"}${whole(Math.abs(projection.pace))}`;

  const tooltipRows = (point: Record<string, unknown>) => {
    const p = point as ProjectionRow;
    if (p.balance !== undefined) {
      return [{ color: warn, label: "Balance", value: whole(p.balance) }];
    }
    return [
      { color: warn, label: "Projected", value: whole(p.projected ?? 0) },
      {
        color: warn,
        label: "Likely",
        value: `${whole(p.low ?? 0)} – ${whole(p.high ?? 0)}`,
      },
    ];
  };

  return (
    <div className="bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 max-sm:p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
            {"Where you're heading"}
          </h3>
          <p className="text-[13px] text-app-muted mt-0.5">
            At your usual pace of{" "}
            <strong className="font-semibold text-app-text">
              {signedPace}
            </strong>{" "}
            a month you&apos;d have about{" "}
            <strong className="font-semibold text-app-text">
              {whole(projection.end)}
            </strong>{" "}
            by{" "}
            <strong className="font-semibold text-app-text">
              {monthYear(projection.endDate)}
            </strong>{" "}
            (likely {whole(projection.endLow)} – {whole(projection.endHigh)}).
          </p>
        </div>
        <Selector
          options={HORIZON_OPTIONS}
          value={horizon}
          onChange={setHorizon}
          size="sm"
          fullWidth={false}
        />
      </div>

      <LineChart
        data={chartRows}
        xDataKey="date"
        aspectRatio="5 / 2"
        margin={{ top: 16, right: 16, bottom: 28, left: 44 }}
        ariaLabel="Balance and projected balance"
      >
        <Grid horizontal />
        <Band
          lowerKey="low"
          upperKey="high"
          fill={warn}
          fillOpacity={0.14}
          label="Likely range"
          showInTooltip={false}
        />
        <Line
          dataKey="value"
          label="Balance"
          stroke={warn}
          strokeWidth={2}
          curve={curveMonotoneX}
          showMarkers={false}
          dashFromIndex={lastRealIndex}
          dashArray="6,4"
        />
        <XAxis
          numTicks={{ base: 4, md: 6, lg: 8 }}
          formatValue={(d) =>
            `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
          }
        />
        <YAxis numTicks={5} formatValue={compactAmount} />
        <ChartTooltip
          dateLabels={rows.map((r) => monthYear(r.date))}
          rows={tooltipRows}
          content={({ point }) => (
            <TooltipContent
              title={monthYear(point.date as Date)}
              rows={tooltipRows(point)}
            />
          )}
        />
      </LineChart>

      <KitLegend
        series={[
          { key: "balance", label: "Balance", color: warn },
          { key: "projected", label: "Projection", color: warn },
          { key: "range", label: "Likely range", color: warn },
        ]}
      />
      <p className="text-[12px] text-app-faint mt-3">
        Based on your typical month over the last 12 (median), so one-off months
        don&apos;t skew it. The range is where 8 in 10 outcomes would land.
      </p>
    </div>
  );
};
