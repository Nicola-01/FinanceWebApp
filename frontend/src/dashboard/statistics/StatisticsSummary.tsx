import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import type { Transaction } from "../../utils/types.ts";
import { buildMonthlyBuckets } from "./ChartRangeSelector.tsx";

interface StatisticsSummaryProps {
  transactions: Transaction[];
}

/** Formats a number with grouped thousands and 2 decimals (matches the Overview table). */
const formatAmount = (value: number): string =>
  value.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface SummaryCardProps {
  label: string;
  icon: React.ReactNode;
  /** Colour class for the headline total. */
  valueClass: string;
  /** Sign prefix already applied to the formatted strings. */
  total: string;
  /** Signed, formatted per-month average (e.g. "+1.569,43"). */
  avgValue: string;
  /** Colour class for the average number (the label + unit stay muted). */
  avgClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  icon,
  valueClass,
  total,
  avgValue,
  avgClass,
}) => (
  <div className="bg-app-card/60 border border-app-border rounded-2xl p-4 flex flex-col items-center gap-1 transition-all">
    <div className="flex items-center gap-1.5 text-app-muted">
      {icon}
      <span className="text-xs font-bold uppercase tracking-widest">
        {label}
      </span>
    </div>
    <p className={`font-bold font-app-mono text-xl ${valueClass}`}>{total}</p>
    <p className="font-app-mono text-xs text-app-muted/70">
      avg <span className={avgClass}>{avgValue}</span> / mo
    </p>
  </div>
);

/**
 * At-a-glance headline for the Statistics tab: total income / expense / net over the
 * wallet's full history, each with a per-active-month average below it. Uses the same
 * transaction set as the Overview table and charts (filter-independent).
 */
export const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({
  transactions,
}) => {
  const stats = useMemo(() => {
    const totals = transactions.reduce(
      (acc, tx) => {
        if (tx.type === "INCOME") acc.income += tx.amount;
        else if (tx.type === "EXPENSE") acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 },
    );
    const net = totals.income - totals.expense;
    const activeMonths = buildMonthlyBuckets(transactions).length;
    const per = (v: number) => (activeMonths > 0 ? v / activeMonths : 0);
    return {
      income: totals.income,
      expense: totals.expense,
      net,
      avgIncome: per(totals.income),
      avgExpense: per(totals.expense),
      avgNet: per(net),
    };
  }, [transactions]);

  const netClass = stats.net >= 0 ? "text-app-green" : "text-app-red";
  const signed = (v: number) =>
    `${v >= 0 ? "+" : "-"}${formatAmount(Math.abs(v))}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 animate-[fadeIn_0.3s_ease-out]">
      <SummaryCard
        label="Income"
        icon={<TrendingUp size={14} className="text-app-green" />}
        valueClass="text-app-green"
        total={`+${formatAmount(stats.income)}`}
        avgValue={`+${formatAmount(stats.avgIncome)}`}
        avgClass="text-app-green/80"
      />
      <SummaryCard
        label="Expense"
        icon={<TrendingDown size={14} className="text-app-red" />}
        valueClass="text-app-red"
        total={`-${formatAmount(stats.expense)}`}
        avgValue={`-${formatAmount(stats.avgExpense)}`}
        avgClass="text-app-red/80"
      />
      <SummaryCard
        label="Net"
        icon={<Scale size={14} className="text-app-blue" />}
        valueClass={netClass}
        total={signed(stats.net)}
        avgValue={signed(stats.avgNet)}
        avgClass={`${netClass}/80`}
      />
    </div>
  );
};
