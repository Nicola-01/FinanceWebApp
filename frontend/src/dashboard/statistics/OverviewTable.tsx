import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Transaction } from "../../types/domain.ts";
import { SwitchableCard } from "../../components/ui/SwitchableCard.tsx";
import { OverviewRow } from "./OverviewRow.tsx";
import { OverviewCellContent } from "./OverviewCell.tsx";
import { useOverviewData, type ViewMode } from "./useOverviewData.ts";

const TABS = [
  { key: "monthly", label: "Monthly", title: "Monthly Overview" },
  { key: "yearly", label: "Yearly", title: "Yearly Overview" },
];

interface MonthlyOverviewProps {
  transactions: Transaction[];
}

export const OverviewTable: React.FC<MonthlyOverviewProps> = ({
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
    scrollContainerRef,
  } = useOverviewData(transactions, viewMode);

  const isMonthly = viewMode === "monthly";

  // Year selector as center element
  const yearSelector = isMonthly ? (
    <div className="flex items-center gap-2 md:ml-5">
      <button
        onClick={() => canGoBack && setSelectedYear((y) => y - 1)}
        disabled={!canGoBack}
        className="p-1.5 rounded-lg bg-app-input border border-app-border text-app-muted hover:bg-app-surface hover:text-app-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-lg font-bold text-app-text min-w-[60px] text-center">
        {selectedYear}
      </span>
      <button
        onClick={() => canGoForward && setSelectedYear((y) => y + 1)}
        disabled={!canGoForward}
        className="p-1.5 rounded-lg bg-app-input border border-app-border text-app-muted hover:bg-app-surface hover:text-app-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  ) : undefined;

  return (
    <SwitchableCard
      tabs={TABS}
      activeTab={viewMode}
      onTabChange={(key) => setViewMode(key as ViewMode)}
      title={TABS.find((t) => t.key === viewMode)?.title}
      centerElement={yearSelector}
      noPadding
      className="my-4"
      selectorWidth="w-[220px]"
    >
      {/* Table with floating left & right overlay columns */}
      <div className="relative">
        {/* Left floating column (icons) — backdrop blur */}
        <div
          className="absolute left-0 top-0 bottom-0 z-20 bg-app-card/50 backdrop-blur-2xl border-r border-app-border flex flex-col"
          style={{ width: "44px" }}
        >
          <div className="border-b border-app-border px-2 py-3 flex-none h-10.25"></div>
          <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
            <TrendingUp size={16} className="text-app-green" />
          </div>
          <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
            <TrendingDown size={16} className="text-app-red" />
          </div>
          <div className="px-2 py-3 flex items-center justify-center flex-1">
            <Scale size={16} className="text-app-blue" />
          </div>
        </div>

        {/* Right floating column (totals) — backdrop blur */}
        <div
          className="absolute right-0 top-0 bottom-0 z-20 bg-app-card/50 backdrop-blur-2xl border-l border-app-border flex flex-col"
          style={{ width: "100px" }}
        >
          <div className="border-b border-app-border px-2 py-3 text-center text-xs text-app-muted uppercase tracking-wider font-bold flex-none">
            Tot
          </div>
          <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
            <OverviewCellContent value={totals.income} type="income" isBold />
          </div>
          <div className="border-b border-app-border px-2 py-3 flex items-center justify-center flex-1">
            <OverviewCellContent value={totals.expense} type="expense" isBold />
          </div>
          <div className="px-2 py-3 flex items-center justify-center flex-1">
            <OverviewCellContent
              value={totals.income - totals.expense}
              type="balance"
              isBold
            />
          </div>
        </div>

        {/* Scrollable table — offset by overlay widths */}
        <div
          className="overflow-x-auto overview-scroll-area"
          ref={scrollContainerRef}
          style={{ marginLeft: "44px", marginRight: "100px" }}
        >
          <table
            className="w-full border-collapse"
            style={{
              tableLayout: "fixed",
              minWidth: `${columns.length * 90}px`,
            }}
          >
            <colgroup>
              {columns.map((c) => (
                <col key={c.key} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-app-border">
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="text-center text-xs text-app-muted uppercase tracking-wider px-1 py-3 font-semibold"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <OverviewRow
                dataItems={dataItems}
                getValue={(m) => m.income}
                type="income"
              />
              <OverviewRow
                dataItems={dataItems}
                getValue={(m) => m.expense}
                type="expense"
              />
              <OverviewRow
                dataItems={dataItems}
                border={false}
                getValue={(m) => m.income - m.expense}
                type="balance"
              />
            </tbody>
          </table>
        </div>
      </div>
    </SwitchableCard>
  );
};
