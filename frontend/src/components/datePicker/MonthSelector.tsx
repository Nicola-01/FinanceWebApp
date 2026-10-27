import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export interface MonthSelectorProps {
  currentDate: Date;
  onSelectMonth: (date: Date) => void;
  onYearClick: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  direction: "next" | "prev";
  isYearPreset?: boolean;
  isAllPreset?: boolean;
  color?: string;
  isDark: boolean;
}

export default function MonthSelector({
  currentDate,
  onSelectMonth,
  onYearClick,
  onPrevYear,
  onNextYear,
  direction,
  isYearPreset,
  isAllPreset,
  color = "#ef4444",
  isDark,
}: MonthSelectorProps) {
  const currentMonthIndex = currentDate.getMonth();
  const yearKey = currentDate.getFullYear();
  // Build labels from day-1 of the selected year so a run on e.g. the 31st never
  // rolls a short month forward. Derives from currentDate, not `new Date()`.
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(yearKey, i, 1);
    return { date, label: format(date, "MMM") };
  });
  const btnNav = `p-2 rounded-md transition-colors ${isDark ? "theme-bg-neutral-dark hover:theme-bg-neutral theme-text-muted" : "theme-bg-inverse-muted hover:theme-bg-inverse-muted theme-text-subtle"}`;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={onPrevYear} className={btnNav}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="overflow-hidden">
          <button
            key={yearKey + "-title"}
            onClick={onYearClick}
            className={`font-semibold px-4 py-1 rounded-md transition-colors ${isDark ? "theme-text-muted hover:theme-bg-neutral-dark" : "theme-text-subtle hover:theme-bg-inverse-muted"} ${direction === "next" ? "anim-next" : "anim-prev"}`}
          >
            {yearKey}
          </button>
        </div>
        <button onClick={onNextYear} className={btnNav}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div
        key={yearKey + "-grid"}
        className={`grid grid-cols-4 gap-2 flex-1 ${direction === "next" ? "anim-next" : "anim-prev"}`}
      >
        {months.map((month, idx) => {
          const isSelected =
            isYearPreset || isAllPreset || currentMonthIndex === idx;
          const defaultStyle = isDark
            ? "theme-text-muted hover:theme-bg-neutral-dark"
            : "theme-text-subtle hover:theme-bg-inverse-muted";
          return (
            <button
              key={idx}
              onClick={() => onSelectMonth(month.date)}
              className={`flex items-center justify-center rounded-lg capitalize text-sm transition-colors ${isSelected ? "theme-text-default font-medium shadow-sm" : defaultStyle}`}
              style={isSelected ? { backgroundColor: color } : {}}
            >
              {month.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
