import React, { useMemo } from "react";
import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";
import { useInvestmentTags } from "../wallet/useInvestmentTags.ts";
import { investmentsSeries } from "./investmentsData.ts";
import { formatKitAmount } from "./kitChartData.ts";
import type { StatsPeriod } from "./statsPeriod.ts";

export interface InvestmentsWidgetProps {
  transactions: Transaction[];
  period: StatsPeriod;
  currencySymbol: string;
  /** Render without the card shell + heading (the parent group card provides them). */
  bare?: boolean;
}

const VIEW_W = 600;
const VIEW_H = 160;
const PLOT_H = 140; // bars and the line; the rest of the height is the month labels
const INVEST = "var(--color-app-invest)";

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

  // Hidden when the period has no investment money at all.
  if (bought === 0 && cashedOut === 0) return null;

  const zeroY = PLOT_H / 2;
  const peak = Math.max(
    1,
    ...months.flatMap((m) => [m.bought, m.cashedOut, Math.abs(m.cumulative)]),
  );
  const k = (PLOT_H / 2 - 6) / peak;
  const step = VIEW_W / Math.max(months.length, 1);
  const barW = step * 0.6;
  const maxNet = Math.max(1, ...byTag.map((t) => Math.abs(t.net)));
  const labelOf = (date: Date) =>
    period.kind === "all"
      ? String(date.getFullYear())
      : MONTH_LABELS[date.getMonth()];

  return (
    <section
      className={
        bare
          ? ""
          : "bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)] p-5 max-sm:p-4"
      }
    >
      {!bare && (
        <>
          <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-app-text">
            Investments
          </h3>
          <p className="text-[13px] text-app-muted mt-0.5">
            What you put in, what came back, and where.
          </p>
        </>
      )}

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto mt-3 text-app-muted"
        role="img"
        aria-label="Bought, cashed out and running invested total per period"
      >
        <line
          x1={0}
          x2={VIEW_W}
          y1={zeroY}
          y2={zeroY}
          stroke="currentColor"
          strokeOpacity={0.3}
        />
        {months.map((m, i) => {
          const x = i * step + step * 0.2;
          return (
            <g key={m.date.getTime()}>
              <rect
                x={x}
                y={zeroY - m.bought * k}
                width={barW}
                height={m.bought * k}
                rx={2}
                fill={INVEST}
              />
              {m.cashedOut > 0 && (
                <rect
                  x={x}
                  y={zeroY}
                  width={barW}
                  height={m.cashedOut * k}
                  rx={2}
                  fill={INVEST}
                  opacity={0.45}
                />
              )}
              <text
                x={x + barW / 2}
                y={VIEW_H - 2}
                textAnchor="middle"
                fontSize={11}
                fill="currentColor"
              >
                {labelOf(m.date)}
              </text>
            </g>
          );
        })}
        <polyline
          points={months
            .map(
              (m, i) => `${i * step + step * 0.5},${zeroY - m.cumulative * k}`,
            )
            .join(" ")}
          fill="none"
          stroke="var(--color-app-text)"
          strokeWidth={1.8}
          strokeDasharray="4 3"
        />
      </svg>

      <div className="grid grid-cols-3 gap-3 mt-3">
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

      <ul className="mt-4 flex flex-col gap-2">
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
    </section>
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
