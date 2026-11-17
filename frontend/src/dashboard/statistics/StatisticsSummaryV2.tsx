import React, { useMemo, useState } from "react";
import { AreaSparkline, LineSparkline } from "@/components/ui/charts";
import type { Transaction } from "../../types/domain.ts";
import { StatTile } from "../../components/ui/StatTile.tsx";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber.tsx";
import { useChartPalette } from "./useChartPalette.ts";
import { summarizePeriod } from "./summaryStats.ts";
import { useInvestmentTags } from "../wallet/useInvestmentTags.ts";
import { defaultPeriod, periodLabel, type StatsPeriod } from "./statsPeriod.ts";

interface StatisticsSummaryV2Props {
  transactions: Transaction[];
  period?: StatsPeriod;
  today?: Date;
  currencySymbol?: string;
}

const pct = (fraction: number) => Math.round(fraction * 100);
/** A sparkline needs two points and at least one non-zero value to say anything. */
const drawable = (rows: { v: number }[]) =>
  rows.length >= 2 && rows.some((r) => r.v !== 0);

/** v2 headline: earned / spent / invested / kept / savings rate for a period, with previous-year deltas. */
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
  const invest = useInvestmentTags();
  const summary = useMemo(
    () => summarizePeriod(transactions, period, today, invest),
    [transactions, period, today, invest],
  );
  const palette = useChartPalette();

  const label = periodLabel(period);
  const isAll = period.kind === "all";
  const { vsPrevious, series, months } = summary;
  const amount = (v: number, signed = false) => (
    <AnimatedNumber
      intro
      value={v}
      kind="amount"
      currency={currencySymbol}
      signed={signed}
      decimals={0}
    />
  );
  const aMonth = (v: number) => <>about {amount(v)} a month</>;
  /** "+12% vs 2025" with the sign and colour of the change. */
  const vsPct = (fraction: number, tone: string | undefined) => (
    <>
      <span className={tone}>
        <AnimatedNumber intro value={pct(fraction)} kind="percent" signed />
      </span>{" "}
      vs {vsPrevious?.label}
    </>
  );
  const tone = (v: number, up: string, down: string) =>
    v > 0 ? up : v < 0 ? down : undefined;

  const earnedPct = vsPrevious?.earnedPct ?? null;
  const earnedSub =
    months > 0 || earnedPct !== null ? (
      <>
        {months > 0 && aMonth(summary.avgEarnedPerMonth)}
        {months > 0 && earnedPct !== null && " · "}
        {earnedPct !== null &&
          vsPct(
            earnedPct,
            tone(earnedPct, "text-app-income", "text-app-danger"),
          )}
      </>
    ) : undefined;

  const spentPct = vsPrevious?.spentPct ?? null;
  const spentSub =
    months > 0 || spentPct !== null ? (
      <>
        {months > 0 && aMonth(summary.spent / months)}
        {months > 0 && spentPct !== null && " · "}
        {/* Spending more is bad, so the colours are inverted. */}
        {spentPct !== null &&
          vsPct(spentPct, tone(spentPct, "text-app-danger", "text-app-income"))}
      </>
    ) : undefined;

  // Kept and savings rate compare against the previous year's absolute values.
  const keptPct =
    vsPrevious && vsPrevious.kept !== 0
      ? pct((summary.kept - vsPrevious.kept) / Math.abs(vsPrevious.kept))
      : null;
  const keptSub = vsPrevious ? (
    <>
      <span
        className={vsPrevious.kept >= 0 ? "text-app-income" : "text-app-danger"}
      >
        {amount(vsPrevious.kept, true)}
      </span>
      {keptPct !== null && (
        <>
          {" ("}
          <span className={keptPct > 0 ? "text-app-income" : "text-app-danger"}>
            <AnimatedNumber intro value={keptPct} kind="percent" signed />
          </span>
          {")"}
        </>
      )}{" "}
      vs {vsPrevious.label}
    </>
  ) : undefined;

  const rateSub =
    vsPrevious?.savingsRate != null && summary.savingsRate != null ? (
      <>
        <AnimatedNumber
          intro
          value={pct(vsPrevious.savingsRate)}
          kind="percent"
        />
        {vsPrevious.savingsRate !== 0 && (
          <>
            {" ("}
            <AnimatedNumber
              intro
              value={pct(
                (summary.savingsRate - vsPrevious.savingsRate) /
                  Math.abs(vsPrevious.savingsRate),
              )}
              kind="percent"
              signed
            />
            {")"}
          </>
        )}{" "}
        vs {vsPrevious.label}
      </>
    ) : undefined;

  const toRows = (values: (number | null)[], scale = 1) =>
    values
      .filter((v): v is number => v !== null)
      .map((v) => ({ v: v * scale }));
  const earnedRows = useMemo(() => toRows(series.earned), [series.earned]);
  const spentRows = useMemo(() => toRows(series.spent), [series.spent]);
  const keptRows = useMemo(() => toRows(series.kept), [series.kept]);
  const rateRows = useMemo(() => toRows(series.rate, 100), [series.rate]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-[14px]">
      <StatTile
        label={isAll ? "Earned" : `Earned in ${label}`}
        value={summary.earned}
        currency={currencySymbol}
        tone="income"
        signed
        sub={earnedSub}
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
        sub={spentSub}
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
        label={isAll ? "Invested" : `Invested in ${label}`}
        value={summary.invested}
        currency={currencySymbol}
        signed
        sub={
          <>
            {amount(summary.bought)} in · {amount(summary.cashedOut)} out
          </>
        }
      />
      <StatTile
        label="Kept"
        value={summary.kept}
        currency={currencySymbol}
        signed
        sub={keptSub}
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
        className="col-span-2 lg:col-span-1"
        sub={rateSub}
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
