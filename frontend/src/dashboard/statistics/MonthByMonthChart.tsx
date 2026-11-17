import React, { useMemo, useState } from "react";
import Toggle from "../../components/ui/Toggle.tsx";
import { MONTH_LABELS } from "../../utils/months.ts";
import { formatKitAmount } from "./kitChartData.ts";
import { KitLegend, KitNoData } from "./KitChartShared.tsx";
import { INVEST_COLOR, MonthByMonthPlot } from "./MonthByMonthPlot.tsx";
import { monthByMonthBound, type MonthByMonthRow } from "./statsChartRows.ts";
import { useChartPalette } from "./useChartPalette.ts";

export interface MonthByMonthChartProps {
  rows: MonthByMonthRow[];
  byYear: boolean;
  currencySymbol: string;
  /** Render without the card shell + heading (the parent group card provides them). */
  bare?: boolean;
}

const INVEST_KEY = "statistics.monthByMonth.showInvestments";

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

const hasAmount = (row: MonthByMonthRow, withInvestments: boolean) =>
  !!(
    row.income ||
    row.expense ||
    row.kept ||
    (withInvestments && (row.bought || row.cashedOut))
  );

/** Earned bars above the line, spent bars below it, and a kept dot per period. */
export const MonthByMonthChart: React.FC<MonthByMonthChartProps> = ({
  rows,
  byYear,
  currencySymbol,
  bare = false,
}) => {
  const { income, expense, kept } = useChartPalette();
  const [showInvestments, setShowInvestments] = useShowInvestments();
  // Page-load entrance keeps the kit default; a chip toggle remounts the plot, so replay it faster.
  const [toggled, setToggled] = useState(false);
  const onChipChange = (next: boolean) => {
    setToggled(true);
    setShowInvestments(next);
  };
  const investData = useMemo<ChartRow[]>(
    () => rows.map((r) => ({ ...r, boughtBelow: -(r.bought ?? 0) })),
    [rows],
  );
  // Each bar sits alone on its own axis: non-stacked bars would otherwise grow from the domain minimum.
  const yDomains = useMemo(() => {
    const bound = monthByMonthBound(rows, showInvestments);
    return {
      left: [-bound, bound] as [number, number],
      spent: [-bound, bound] as [number, number],
    };
  }, [rows, showInvestments]);
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
        ...(showInvestments && (p.cashedOut ?? 0) > 0
          ? [
              {
                color: INVEST_COLOR,
                label: "Cashed out",
                value: formatKitAmount(p.cashedOut!, currencySymbol),
              },
            ]
          : []),
        ...(showInvestments && (p.bought ?? 0) > 0
          ? [
              {
                color: INVEST_COLOR,
                label: "Bought",
                value: formatKitAmount(p.bought!, currencySymbol),
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
        ...(showInvestments && p.liquidity !== undefined
          ? [
              {
                color: kept,
                label: "Liquidity left",
                value: formatKitAmount(p.liquidity, currencySymbol, true),
              },
            ]
          : []),
      ];
    },
    [income, expense, kept, currencySymbol, showInvestments],
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
            onChange={onChipChange}
            label="↗ Investments"
          />
        </div>
      )}
      {rows.some((r) => hasAmount(r, showInvestments)) ? (
        <>
          {/* Keyed so toggling the chip remounts the plot and the kit replays its entrance animation. */}
          <MonthByMonthPlot
            key={showInvestments ? "with-investments" : "base"}
            rows={rows}
            data={showInvestments ? investData : rows}
            showInvestments={showInvestments}
            yDomains={yDomains}
            byYear={byYear}
            tickLabels={tickLabels}
            tooltipLabels={tooltipLabels}
            tooltipRows={tooltipRows}
            animationDuration={toggled ? 450 : undefined}
          />
          {/* The legend's own top margin moves to this row; the swatch shares its centred line. */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 mt-3 [&>*]:mt-0">
            <KitLegend series={series} />
            {showInvestments && (
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
            )}
          </div>
        </>
      ) : (
        <KitNoData />
      )}
    </section>
  );
};
