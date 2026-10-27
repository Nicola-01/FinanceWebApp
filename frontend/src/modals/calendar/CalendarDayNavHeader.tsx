import React from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

interface CalendarDayNavHeaderProps {
  selectedDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

/** ‹ Today / 5 Jan 2026 › header of the calendar day panel. */
export const CalendarDayNavHeader: React.FC<CalendarDayNavHeaderProps> = ({
  selectedDate,
  onPrev,
  onNext,
}) => {
  const isToday = isSameDay(selectedDate, new Date());

  const dayLabel = (() => {
    if (isToday) return "Today";
    if (isSameDay(selectedDate, subDays(new Date(), 1))) return "Yesterday";
    if (isSameDay(selectedDate, addDays(new Date(), 1))) return "Tomorrow";
    return format(selectedDate, "EEEE");
  })();

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-app-border bg-app-input/20">
      <button
        onClick={onPrev}
        className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-app-muted hover:text-app-text hover:bg-app-surface transition-all active:scale-90"
        aria-label="Previous day"
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
      </button>

      <div className="flex flex-col items-center gap-0.5 select-none min-w-0">
        <span
          className={`text-sm sm:text-base font-bold ${isToday ? "text-app-sky" : "text-app-text"}`}
        >
          {dayLabel}
        </span>
        <span className="text-[10px] sm:text-xs text-app-muted font-medium">
          {format(selectedDate, "d MMM yyyy")}
        </span>
      </div>

      <button
        onClick={onNext}
        className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-app-muted hover:text-app-text hover:bg-app-surface transition-all active:scale-90"
        aria-label="Next day"
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
      </button>
    </div>
  );
};
