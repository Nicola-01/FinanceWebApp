import React, { useMemo, useState } from "react";
import type { Transaction } from "../../types/domain.ts";
import CustomDatePicker, {
  type DateRangeValue,
} from "../../components/datePicker/CustomDatePicker.tsx";
import { EmptyState } from "../../components/ui/EmptyState.tsx";
import { TabHeader } from "../wallet/TabHeader.tsx";
import { useTabLayout } from "../layout/useTabLayout.ts";
import { useInvestmentTags } from "../wallet/useInvestmentTags.ts";
import { WidgetGrid } from "../layout/WidgetGrid.tsx";
import { StatisticsSummaryV2 } from "./StatisticsSummaryV2.tsx";
import { MonthByMonthChart } from "./MonthByMonthChart.tsx";
import { WorthKnowingCard } from "./WorthKnowingCard.tsx";
import {
  STATISTICS_TAB_ID,
  statisticsWidgetsFor,
  type StatisticsWidgetCtx,
} from "./statisticsWidgets.tsx";
import { currencySymbolOf } from "./kitChartData.ts";
import {
  balanceHistory,
  monthByMonthRows,
  waterfallRows,
} from "./statsChartRows.ts";
import { buildInsights } from "./statisticsInsights.ts";
import { defaultPeriod, type StatsPeriod } from "./statsPeriod.ts";

/** v2 Statistics page: period selector, summary, and the customizable widget grid. */
export const StatisticsV2: React.FC<{
  transactions: Transaction[];
  currency: string;
  walletId: string;
  /** Wallet colour — accents the widget grid's merge and tray highlights. */
  accentColor: string;
  /** Transactions are still loading: charts show their loading placeholders, not empty states. */
  isLoading?: boolean;
  /** Layout-edit controls, supplied by the orchestrator, rendered under the grid. */
  renderLayoutControls?: (state: {
    editing: boolean;
    setEditing: (v: boolean) => void;
    hiddenCount: number;
    reset: () => void;
  }) => React.ReactNode;
}> = ({
  transactions,
  currency,
  walletId,
  accentColor,
  isLoading = false,
  renderLayoutControls,
}) => {
  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<StatsPeriod>(() => defaultPeriod(today));
  const [editing, setEditing] = useState(false);
  const invest = useInvestmentTags();
  // Investment UI (chip, Invested tile, investments widget) only once a tag is flagged.
  const hasInvestments = invest.size > 0;
  const widgets = useMemo(
    () => statisticsWidgetsFor(hasInvestments),
    [hasInvestments],
  );
  const layoutApi = useTabLayout(STATISTICS_TAB_ID, walletId, widgets);
  const byYear = period.kind === "all";
  // Year the picker opens on (its initial range); "All" keeps the current year.
  const pickerYear = period.kind === "year" ? period.year : today.getFullYear();
  const currencySymbol = currencySymbolOf(currency);

  // While loading there is no data yet: skip the stats so no "empty" insight or chart flashes up.
  const rows = useMemo(
    () =>
      isLoading ? [] : monthByMonthRows(transactions, period, today, invest),
    [isLoading, transactions, period, today, invest],
  );
  const waterfall = useMemo(
    () => (isLoading ? [] : waterfallRows(transactions, period, today)),
    [isLoading, transactions, period, today],
  );
  const history = useMemo(
    () => (isLoading ? [] : balanceHistory(transactions, today)),
    [isLoading, transactions, today],
  );
  const insights = useMemo(
    () =>
      isLoading
        ? []
        : buildInsights(transactions, period, currencySymbol, invest),
    [isLoading, transactions, period, currencySymbol, invest],
  );

  const ctx: StatisticsWidgetCtx = {
    rows,
    waterfall,
    history,
    insights,
    transactions,
    byYear,
    currencySymbol,
    loading: isLoading,
  };

  return (
    <div className="flex flex-col animate-[fadeIn_0.3s_ease-out]">
      <TabHeader
        title="Statistics"
        actions={
          <div className="w-full sm:w-auto sm:min-w-[16rem]">
            <CustomDatePicker
              isRange
              color={accentColor}
              allowedPresets={["year", "all"]}
              initialPreset={period.kind === "all" ? "all" : "year"}
              initialStartDate={new Date(pickerYear, 0, 1)}
              initialEndDate={new Date(pickerYear, 11, 31)}
              onChange={(val) => {
                // "All" emits a null start; only a year range changes the period here.
                const { start } = val as DateRangeValue;
                if (!start) return;
                const year = start.getFullYear();
                setPeriod((p) =>
                  p.kind === "year" && p.year === year
                    ? p
                    : { kind: "year", year },
                );
              }}
              // The picker calls this on every render (its effect depends on the callback):
              // keep the same state object when nothing changed, or "All" loops forever.
              onPresetChange={(preset) => {
                if (preset === "all")
                  setPeriod((p) => (p.kind === "all" ? p : { kind: "all" }));
              }}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {transactions.length === 0 && !isLoading ? (
          <div className="bg-app-card rounded-[var(--r-card)] shadow-[var(--box-ring)]">
            <EmptyState
              title="No statistics yet"
              description="Add a few transactions and your charts will show up here."
            />
          </div>
        ) : (
          <>
            {/* One 14px rhythm for every card and tile gap, vertical and horizontal. */}
            <div className="flex flex-col gap-3.5">
              <StatisticsSummaryV2
                transactions={transactions}
                loading={isLoading}
                period={period}
                today={today}
                currencySymbol={currencySymbol}
                hasInvestments={hasInvestments}
              />

              {/* Pinned: month by month (2/3) with Worth knowing beside it (1/3); equal height. */}
              <div className="grid grid-cols-1 items-stretch gap-3.5 lg:grid-cols-3">
                <div
                  className={`h-full ${
                    insights.length > 0 || isLoading
                      ? "lg:col-span-2"
                      : "lg:col-span-3"
                  }`}
                >
                  <MonthByMonthChart
                    rows={rows}
                    byYear={byYear}
                    currencySymbol={currencySymbol}
                    hasInvestments={hasInvestments}
                    loading={isLoading}
                  />
                </div>
                <WorthKnowingCard insights={insights} loading={isLoading} />
              </div>

              <WidgetGrid
                defs={widgets}
                ctx={ctx}
                editing={editing}
                api={layoutApi}
                accentColor={accentColor}
                gap="gap-3.5"
              />
            </div>
            {renderLayoutControls?.({
              editing,
              setEditing,
              hiddenCount: layoutApi.layout.hiddenSlots.length,
              reset: layoutApi.reset,
            })}
          </>
        )}
      </div>
    </div>
  );
};
