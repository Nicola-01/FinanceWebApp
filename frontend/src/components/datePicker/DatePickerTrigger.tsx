import React from "react";
import { format, subMonths, addMonths, subYears, addYears } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUiVersion } from "../../hooks/useUiVersion";
import type { PresetType } from "./datePresets";

export interface DatePickerTriggerProps {
  isRange: boolean;
  isDark: boolean;
  preset: PresetType;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  startDate: Date | null;
  endDate: Date | null;
  onToggle: () => void;
  triggerClassName?: string;
}

const textMain = "text-app-text";
const textMuted = "text-app-muted";
const borderMain = "border-app-border";
const bgHover = "hover:bg-app-hover";
const bgInput = "bg-app-input";
const borderInput = "border-app-border";

const formatDateLabel = (date: Date | null) =>
  date ? format(date, "MMM d, yyyy") : "-";

/** Clickable field of CustomDatePicker showing the current selection. */
export default function DatePickerTrigger({
  isRange,
  isDark,
  preset,
  currentDate,
  setCurrentDate,
  startDate,
  endDate,
  onToggle,
  triggerClassName,
}: DatePickerTriggerProps) {
  const [ui] = useUiVersion();
  // ui-v2-switch: v2 is a flat raised field (like Input) with no border.
  const isV2 = ui === "v2";
  const bgMain = isDark ? "bg-app-card" : "bg-app-bg";
  const textFaint = isV2 ? "text-app-faint" : textMuted;
  // ui-v2-switch: step arrows are always enabled here, so v2 gives them the muted
  // (not faint) tone with a hover lift; v1 keeps its original styling.
  const arrowClass = isV2
    ? "p-1 shrink-0 text-app-muted hover:text-app-text hover:bg-app-card rounded-[var(--r-sm)]"
    : `p-1 rounded shrink-0 ${bgHover} ${textMuted}`;
  const chipBg = isV2
    ? "bg-app-card rounded-[var(--r-sm)]"
    : `rounded border ${bgInput} ${borderInput}`;

  const renderTriggerContent = () => {
    // Single-date mode: show just the selected date
    if (!isRange) {
      return (
        <span className={`${textMain} font-medium text-sm flex-1 text-center`}>
          {startDate ? format(startDate, "MMM d, yyyy") : "Select a date"}
        </span>
      );
    }

    if (preset === "all")
      return (
        <span className={`${textMain} font-medium text-sm flex-1 text-center`}>
          All transactions
        </span>
      );

    if (preset === "last30")
      return (
        <span className={`${textMain} font-medium text-sm flex-1 text-center`}>
          Last 30 Days
        </span>
      );

    if (preset === "month") {
      return (
        <div className="flex items-center justify-between w-full flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => subMonths(prev, 1));
            }}
            className={arrowClass}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`${textMain} font-medium text-sm capitalize flex-1 min-w-0 text-center truncate px-1`}
          >
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => addMonths(prev, 1));
            }}
            className={arrowClass}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }
    if (preset === "year") {
      return (
        <div className="flex items-center justify-between w-full flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => subYears(prev, 1));
            }}
            className={arrowClass}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`${textMain} font-medium text-sm flex-1 min-w-0 text-center truncate px-1`}
          >
            {format(currentDate, "yyyy")}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentDate((prev) => addYears(prev, 1));
            }}
            className={arrowClass}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-2 flex-1 min-w-0 font-medium text-sm w-full text-app-text`}
      >
        <span
          className={`flex-1 min-w-0 truncate text-center py-1 px-2 ${chipBg}`}
        >
          {formatDateLabel(startDate)}
        </span>
        <span className={`${textFaint} shrink-0`}>→</span>
        <span
          className={`flex-1 min-w-0 truncate text-center py-1 px-2 ${chipBg}`}
        >
          {formatDateLabel(endDate)}
        </span>
      </div>
    );
  };

  return (
    <div
      onClick={onToggle}
      className={
        triggerClassName
          ? `flex-1 min-w-0 flex items-center justify-between cursor-pointer ${triggerClassName}`
          : // ui-v2-switch
            isV2
            ? "flex-1 min-w-0 flex items-center justify-between px-3 py-2.5 rounded-[var(--r-input)] bg-app-raised text-app-text cursor-pointer transition-shadow duration-200 focus-within:ring-2 focus-within:ring-wallet/40"
            : `flex-1 min-w-0 flex items-center justify-between p-3 border rounded-lg shadow-sm cursor-pointer transition-colors h-12 ${bgMain} ${borderMain} hover:border-opacity-70`
      }
    >
      <div className="flex items-center w-full min-w-0">
        {renderTriggerContent()}
      </div>
    </div>
  );
}
