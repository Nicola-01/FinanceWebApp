import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Transaction } from "../../types/domain.ts";
import { SwitchableCard } from "../../components/ui/SwitchableCard.tsx";
import Button from "../../components/ui/Button.tsx";
import { formatAmount } from "../../utils/format.ts";
import { useOverviewData, type ViewMode } from "./useOverviewData.ts";

const TABS = [
  { key: "monthly", label: "Monthly", title: "Monthly overview" },
  { key: "yearly", label: "Yearly", title: "Yearly overview" },
];

// Phones stack each period (label on top, three values below); sm+ is one table row.
const COLS = "grid-cols-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr] gap-x-3 gap-y-1";
const ROW = `${COLS} px-4 md:px-6 py-3 border-b border-app-border text-sm tabular-nums`;

const Amount: React.FC<{ value: number; kind: "income" | "spent" | "net" }> = ({
  value,
  kind,
}) => {
  if (value === 0) return <span className="text-app-faint">—</span>;
  const sign = kind === "spent" || (kind === "net" && value < 0) ? "-" : "+";
  // Only income is green; expenses and net stay in the normal text colour.
  const tone = kind === "income" ? "text-app-income" : "text-app-text";
  return (
    <span className={tone}>{`${sign}${formatAmount(Math.abs(value))}`}</span>
  );
};

const Value: React.FC<{
  caption: string;
  value: number;
  kind: "income" | "spent" | "net";
}> = ({ caption, value, kind }) => (
  <div role="cell" className="text-left sm:text-right">
    <span className="block text-[13px] text-app-muted sm:hidden">
      {caption}
    </span>
    <Amount value={value} kind={kind} />
  </div>
);

interface Period {
  key: string;
  label: string;
  income: number;
  expense: number;
}

interface OverviewTableV2Props {
  transactions: Transaction[];
}

/** v2 overview: one row per month (or year) with income, spent and net. */
export const OverviewTableV2: React.FC<OverviewTableV2Props> = ({
  transactions,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const {
    selectedYear,
    setSelectedYear,
    canGoBack,
    canGoForward,
    columns,
    dataItems,
    totals,
  } = useOverviewData(transactions, viewMode);

  const isMonthly = viewMode === "monthly";
  const periods: Period[] = columns.map((c, i) => ({
    key: c.key,
    label: c.label,
    income: dataItems[i].income,
    expense: dataItems[i].expense,
  }));
  const title = TABS.find((t) => t.key === viewMode)?.title;
  const maxAbsNet = Math.max(
    1,
    ...periods.map((p) => Math.abs(p.income - p.expense)),
  );
  // The current month (monthly view, this year) or the current year (yearly view).
  const now = new Date();
  const isCurrent = (key: string) =>
    isMonthly
      ? selectedYear === now.getFullYear() && key === String(now.getMonth())
      : key === String(now.getFullYear());

  const yearSelector = isMonthly ? (
    <div className="flex items-center gap-2 md:ml-5">
      <Button
        variant="secondary"
        size="icon"
        aria-label="Previous year"
        disabled={!canGoBack}
        onClick={() => setSelectedYear((y) => y - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <span className="font-display text-[17px] font-semibold text-app-text min-w-[60px] text-center tabular-nums">
        {selectedYear}
      </span>
      <Button
        variant="secondary"
        size="icon"
        aria-label="Next year"
        disabled={!canGoForward}
        onClick={() => setSelectedYear((y) => y + 1)}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  ) : undefined;

  return (
    <SwitchableCard
      tabs={TABS}
      activeTab={viewMode}
      onTabChange={(key) => setViewMode(key as ViewMode)}
      title={title}
      centerElement={yearSelector}
      noPadding
      selectorWidth="w-[220px]"
    >
      <div role="table" aria-label={title} className="text-app-text">
        <div
          role="row"
          className={`hidden sm:grid ${COLS} px-4 md:px-6 py-2.5 text-[13px] text-app-muted border-b border-app-border`}
        >
          <div role="columnheader">{isMonthly ? "Month" : "Year"}</div>
          <div role="columnheader" className="text-right">
            Income
          </div>
          <div role="columnheader" className="text-right">
            Spent
          </div>
          <div role="columnheader" className="text-right">
            Net
          </div>
        </div>
        {periods.map((p) => {
          const net = p.income - p.expense;
          // Track length = |net| relative to the busiest period; neutral colour (only income is green).
          const pct = (Math.abs(net) / maxAbsNet) * 100;
          return (
            <div
              key={p.key}
              role="row"
              className={`grid ${ROW} ${isCurrent(p.key) ? "bg-app-raised" : ""}`}
            >
              <div
                role="rowheader"
                className="col-span-3 font-medium sm:col-span-1"
              >
                {p.label}
                <div className="mt-1.5 h-1.5 rounded-full bg-app-raised">
                  <div
                    className="h-full rounded-full bg-app-faint"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <Value caption="Income" value={p.income} kind="income" />
              <Value caption="Spent" value={p.expense} kind="spent" />
              <Value caption="Net" value={net} kind="net" />
            </div>
          );
        })}
        <div role="row" className={`grid ${ROW} border-b-0 font-semibold`}>
          <div role="rowheader" className="col-span-3 sm:col-span-1">
            Total
          </div>
          <Value caption="Income" value={totals.income} kind="income" />
          <Value caption="Spent" value={totals.expense} kind="spent" />
          <Value
            caption="Net"
            value={totals.income - totals.expense}
            kind="net"
          />
        </div>
      </div>
    </SwitchableCard>
  );
};
