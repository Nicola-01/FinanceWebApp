import React from "react";
import { format, subMonths, addMonths, subYears, addYears } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const bgMain = isDark ? "bg-app-card" : "bg-app-bg";

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
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
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
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
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
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
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
            className={`p-1 rounded shrink-0 ${bgHover} ${textMuted}`}
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
          className={`flex-1 min-w-0 truncate text-center rounded py-1 px-2 border ${bgInput} ${borderInput}`}
        >
          {formatDateLabel(startDate)}
        </span>
        <span className={`${textMuted} shrink-0`}>→</span>
        <span
          className={`flex-1 min-w-0 truncate text-center rounded py-1 px-2 border ${bgInput} ${borderInput}`}
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
          : `flex-1 min-w-0 flex items-center justify-between p-3 border rounded-lg shadow-sm cursor-pointer transition-colors h-12 ${bgMain} ${borderMain} hover:border-opacity-70`
      }
    >
      <div className="flex items-center w-full min-w-0">
        {renderTriggerContent()}
      </div>
    </div>
  );
}
