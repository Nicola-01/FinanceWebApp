import React, { useMemo, useState } from "react";
import type { Transaction } from "../../types/domain.ts";
import {
  Selector,
  type SelectorOption,
} from "../../components/ui/Selector.tsx";
import { Collapse } from "../../components/ui/Collapse.tsx";
import { EmptyState } from "../../components/ui/EmptyState.tsx";
import { StatisticsSummaryV2 } from "./StatisticsSummaryV2.tsx";
import { MonthByMonthChart } from "./MonthByMonthChart.tsx";
import { WorthKnowingCard } from "./WorthKnowingCard.tsx";
import { YearWaterfallChart } from "./YearWaterfallChart.tsx";
import { FixedVsEverydayChart } from "./FixedVsEverydayChart.tsx";
import { BalanceProjectionChart } from "./BalanceProjectionChart.tsx";
import { OverviewTableV2 } from "./OverviewTableV2.tsx";
import { currencySymbolOf } from "./kitChartData.ts";
import {
  balanceHistory,
  fixedVsEverydayRows,
  monthByMonthRows,
  waterfallRows,
} from "./statsChartRows.ts";
import { buildInsights } from "./statisticsInsights.ts";
import {
  availableYears,
  defaultPeriod,
  type StatsPeriod,
} from "./statsPeriod.ts";

/** v2 Statistics page: period selector, summary, charts, insights and the numbers table. */
export const StatisticsV2: React.FC<{
  transactions: Transaction[];
  currency: string;
}> = ({ transactions, currency }) => {
  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<StatsPeriod>(() => defaultPeriod(today));
  const byYear = period.kind === "all";
  const currencySymbol = currencySymbolOf(currency);

  const periodOptions = useMemo<SelectorOption<number | "all">[]>(() => {
    const years = [
      ...new Set([today.getFullYear(), ...availableYears(transactions)]),
    ].sort((a, b) => b - a);
    return [
      ...years.map((year) => ({ value: year, label: String(year) })),
      { value: "all", label: "All time" },
    ];
  }, [transactions, today]);

  const rows = useMemo(
    () => monthByMonthRows(transactions, period, today),
    [transactions, period, today],
  );
  const waterfall = useMemo(
    () => waterfallRows(transactions, period, today),
    [transactions, period, today],
  );
  const fixedVsEveryday = useMemo(
    () => fixedVsEverydayRows(transactions, period, today),
    [transactions, period, today],
  );
  const history = useMemo(
    () => balanceHistory(transactions, today),
    [transactions, today],
  );
  const insights = useMemo(
    () => buildInsights(transactions, period, currencySymbol),
    [transactions, period, currencySymbol],
  );

  return (
    <div className="flex flex-col gap-[14px] pb-10 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
          Statistics
        </h2>
        <Selector
          size="sm"
          fullWidth={false}
          options={periodOptions}
          value={period.kind === "all" ? "all" : period.year}
          onChange={(value) =>
            setPeriod(
              value === "all" ? { kind: "all" } : { kind: "year", year: value },
            )
          }
        />
      </div>

      {transactions.length === 0 ? (
        <div className="bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)]">
          <EmptyState
            title="No statistics yet"
            description="Add a few transactions and your charts will show up here."
          />
        </div>
      ) : (
        <>
          <StatisticsSummaryV2
            transactions={transactions}
            period={period}
            today={today}
            currencySymbol={currencySymbol}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
            <div
              className={
                insights.length > 0 ? "lg:col-span-2" : "lg:col-span-3"
              }
            >
              <MonthByMonthChart
                rows={rows}
                byYear={byYear}
                currencySymbol={currencySymbol}
              />
            </div>
            <WorthKnowingCard insights={insights} />
          </div>

          <YearWaterfallChart
            rows={waterfall}
            byYear={byYear}
            currencySymbol={currencySymbol}
          />

          <FixedVsEverydayChart
            rows={fixedVsEveryday}
            byYear={byYear}
            currencySymbol={currencySymbol}
          />

          <BalanceProjectionChart
            history={history}
            currencySymbol={currencySymbol}
          />

          <Collapse title="Show the numbers" size="sm">
            <OverviewTableV2 transactions={transactions} />
          </Collapse>
        </>
      )}
    </div>
  );
};
