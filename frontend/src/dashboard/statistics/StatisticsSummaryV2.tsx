import React, { useMemo, useState } from "react";
import { AreaSparkline, LineSparkline } from "@/components/ui/charts";
import type { Transaction } from "../../types/domain.ts";
import { StatTile } from "../../components/ui/StatTile.tsx";
import { useChartPalette } from "./useChartPalette.ts";
import { summarizePeriod } from "./summaryStats.ts";
import { defaultPeriod, periodLabel, type StatsPeriod } from "./statsPeriod.ts";

interface StatisticsSummaryV2Props {
  transactions: Transaction[];
  period?: StatsPeriod;
  today?: Date;
  currencySymbol?: string;
}

const signOf = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "");
const pct = (fraction: number) => Math.round(fraction * 100);
/** A sparkline needs two points and at least one non-zero value to say anything. */
const drawable = (rows: { v: number }[]) =>
  rows.length >= 2 && rows.some((r) => r.v !== 0);

/** v2 headline: earned / spent / kept / savings rate for a period, with previous-year deltas. */
export const StatisticsSummaryV2: React.FC<StatisticsSummaryV2Props> = ({
  transactions,
  period: periodProp,
  today: todayProp,
  currencySymbol = "€",
}) => {
  const [mountedToday] = useState(() => new Date());
  const today = todayProp ?? mountedToday;
  const period = useMemo(
    () => periodProp ?? defaultPeriod(today),
    [periodProp, today],
  );
  const summary = useMemo(
    () => summarizePeriod(transactions, period, today),
    [transactions, period, today],
  );
  const palette = useChartPalette();

  const label = periodLabel(period);
  const isAll = period.kind === "all";
  const whole = (v: number) =>
    `${Math.round(v).toLocaleString("it-IT")} ${currencySymbol}`;
  const signedWhole = (v: number) => `${signOf(v)}${whole(Math.abs(v))}`;
  const { vsPrevious, series, months } = summary;
  const perMonth = (v: number) => `about ${whole(v)} a month`;

  const spentPct =
    vsPrevious?.spentPct != null ? pct(vsPrevious.spentPct) : null;
  const spentSub =
    spentPct !== null && vsPrevious ? (
      <>
        <span
          className={
            spentPct > 0
              ? "text-app-danger"
              : spentPct < 0
                ? "text-app-income"
                : ""
          }
        >
          {`${signOf(spentPct)}${Math.abs(spentPct)}%`}
        </span>{" "}
        vs {vsPrevious.label}
      </>
    ) : months > 0 ? (
      perMonth(summary.spent / months)
    ) : null;

  const toRows = (values: (number | null)[], scale = 1) =>
    values
      .filter((v): v is number => v !== null)
      .map((v) => ({ v: v * scale }));
  const earnedRows = useMemo(() => toRows(series.earned), [series.earned]);
  const spentRows = useMemo(() => toRows(series.spent), [series.spent]);
  const keptRows = useMemo(() => toRows(series.kept), [series.kept]);
  const rateRows = useMemo(() => toRows(series.rate, 100), [series.rate]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
      <StatTile
        label={isAll ? "Earned" : `Earned in ${label}`}
        value={summary.earned}
        currency={currencySymbol}
        tone="income"
        signed
        sub={months > 0 ? perMonth(summary.avgEarnedPerMonth) : undefined}
        footer={
          drawable(earnedRows) ? (
            <AreaSparkline
              data={earnedRows}
              dataKey="v"
              color={palette.income}
              fill="gradient"
              height={36}
              curve="monotone"
              interactive={false}
              className="w-full"
              ariaLabel="Earned per month"
            />
          ) : undefined
        }
      />
      <StatTile
        label={isAll ? "Spent" : `Spent in ${label}`}
        value={summary.spent}
        currency={currencySymbol}
        sub={spentSub ?? undefined}
        footer={
          drawable(spentRows) ? (
            <AreaSparkline
              data={spentRows}
              dataKey="v"
              color={palette.expense}
              height={36}
              curve="monotone"
              interactive={false}
              className="w-full"
              ariaLabel="Spent per month"
            />
          ) : undefined
        }
      />
      <StatTile
        label="Kept"
        value={summary.kept}
        currency={currencySymbol}
        signed
        sub={
          vsPrevious ? (
            <>
              {`${vsPrevious.label}: `}
              <span
                className={
                  vsPrevious.kept >= 0 ? "text-app-income" : "text-app-danger"
                }
              >
                {signedWhole(vsPrevious.kept)}
              </span>
            </>
          ) : undefined
        }
        footer={
          drawable(keptRows) ? (
            <LineSparkline
              data={keptRows}
              dataKey="v"
              color={palette.balance}
              height={36}
              curve="monotone"
              interactive={false}
              className="w-full"
              ariaLabel="Kept per month"
            />
          ) : undefined
        }
      />
      <StatTile
        label="Savings rate"
        value={summary.savingsRate === null ? "—" : summary.savingsRate * 100}
        kind="percent"
        sub={
          vsPrevious?.savingsRate != null
            ? `${vsPrevious.label}: ${pct(vsPrevious.savingsRate)}%`
            : undefined
        }
        footer={
          drawable(rateRows) ? (
            <LineSparkline
              data={rateRows}
              dataKey="v"
              color={palette.warn}
              height={36}
              curve="monotone"
              interactive={false}
              className="w-full"
              ariaLabel="Savings rate per month"
            />
          ) : undefined
        }
      />
    </div>
  );
};
