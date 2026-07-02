import React, { useMemo } from "react";
import {
  format,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { it } from "date-fns/locale";
import { useWalletContext } from "../wallet/WalletContext.tsx";

export const DateRangeBanner: React.FC = () => {
  const { filteredTransactions } = useWalletContext();

  const info = useMemo(() => {
    if (filteredTransactions.length === 0) return null;

    const dates = filteredTransactions.map((t) =>
      new Date(t.transactionDate).getTime(),
    );
    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const startStr = format(start, "dd MMM yyyy", { locale: it });
    const endStr = format(end, "dd MMM yyyy", { locale: it });

    const years = differenceInYears(end, start);
    const tempDate = new Date(start);
    tempDate.setFullYear(tempDate.getFullYear() + years);
    const months = differenceInMonths(end, tempDate);
    tempDate.setMonth(tempDate.getMonth() + months);
    const days = differenceInDays(end, tempDate);

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0)
      parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);

    const durationStr =
      parts.length > 0
        ? parts.length === 1
          ? parts[0]
          : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1]
        : "same day";

    return {
      startStr,
      endStr,
      durationStr,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  if (!info) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-x-3 gap-y-1.5 text-sm text-app-muted bg-app-input border border-app-border rounded-xl px-4 py-2.5 mb-4">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-app-text">{info.startStr}</span>
        <span>→</span>
        <span className="font-semibold text-app-text">{info.endStr}</span>
      </div>

      <span className="text-app-border hidden sm:block">|</span>

      <div className="flex items-center gap-3">
        <span className="text-app-muted italic">{info.durationStr}</span>
        <span className="text-app-border">|</span>
        <span className="text-app-muted">
          {info.count} transaction{info.count !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
};
