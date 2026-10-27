import { useMemo, useState, useEffect, useRef } from "react";
import type { Transaction } from "../../types/domain.ts";
import { MONTH_LABELS } from "../../utils/months.ts";

export type ViewMode = "monthly" | "yearly";

/**
 * Data for `OverviewTable`: available years + selected year, per-month or
 * per-year income/expense buckets with their totals, the table columns, and a
 * ref whose container auto-scrolls to the rightmost column holding data.
 */
export const useOverviewData = (
  transactions: Transaction[],
  viewMode: ViewMode,
) => {
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach((tx) =>
      years.add(new Date(tx.transactionDate).getFullYear()),
    );
    const sorted = Array.from(years).sort((a, b) => b - a);
    return sorted.length > 0 ? sorted : [new Date().getFullYear()];
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);

  // --- Monthly data ---
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }));
    transactions.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      if (d.getFullYear() !== selectedYear) return;
      const month = d.getMonth();
      if (tx.type === "INCOME") data[month].income += tx.amount;
      else data[month].expense += tx.amount;
    });
    return data;
  }, [transactions, selectedYear]);

  const monthlyTotals = useMemo(
    () =>
      monthlyData.reduce(
        (acc, m) => ({
          income: acc.income + m.income,
          expense: acc.expense + m.expense,
        }),
        { income: 0, expense: 0 },
      ),
    [monthlyData],
  );

  // --- Yearly data ---
  const yearlyColumns = useMemo(() => {
    const sorted = [...availableYears].sort((a, b) => a - b);
    return sorted.slice(-10);
  }, [availableYears]);

  const yearlyData = useMemo(() => {
    const data = new Map<number, { income: number; expense: number }>();
    yearlyColumns.forEach((y) => data.set(y, { income: 0, expense: 0 }));
    transactions.forEach((tx) => {
      const year = new Date(tx.transactionDate).getFullYear();
      const entry = data.get(year);
      if (!entry) return;
      if (tx.type === "INCOME") entry.income += tx.amount;
      else entry.expense += tx.amount;
    });
    return yearlyColumns.map((y) => ({ year: y, ...data.get(y)! }));
  }, [transactions, yearlyColumns]);

  const yearlyTotals = useMemo(
    () =>
      yearlyData.reduce(
        (acc, y) => ({
          income: acc.income + y.income,
          expense: acc.expense + y.expense,
        }),
        { income: 0, expense: 0 },
      ),
    [yearlyData],
  );

  const canGoBack = availableYears.includes(selectedYear - 1);
  const canGoForward = availableYears.includes(selectedYear + 1);

  const isMonthly = viewMode === "monthly";
  const columns = isMonthly
    ? MONTH_LABELS.map((m, i) => ({ key: String(i), label: m }))
    : yearlyData.map((y) => ({ key: String(y.year), label: String(y.year) }));

  const dataItems = isMonthly ? monthlyData : yearlyData;

  const totals = isMonthly ? monthlyTotals : yearlyTotals;

  const rightmostDataIndex = useMemo(() => {
    let lastIndex = 0;
    const data = isMonthly ? monthlyData : yearlyData;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].income !== 0 || data[i].expense !== 0) {
        lastIndex = i;
        break;
      }
    }
    return lastIndex;
  }, [isMonthly, monthlyData, yearlyData]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const timeoutId = setTimeout(() => {
      const columnWidth = container.scrollWidth / columns.length;
      const targetScrollLeft =
        (rightmostDataIndex + 1) * columnWidth - container.clientWidth;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [rightmostDataIndex, viewMode, selectedYear, columns.length]);

  return {
    selectedYear,
    setSelectedYear,
    canGoBack,
    canGoForward,
    columns,
    dataItems,
    totals,
    scrollContainerRef,
  };
};
