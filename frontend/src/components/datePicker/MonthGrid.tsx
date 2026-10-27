import React from "react";
import {
  startOfMonth,
  startOfWeek,
  addDays,
  eachDayOfInterval,
  isBefore,
} from "date-fns";
import DayCell from "./DayCell";
import type { PresetType } from "./datePresets";

export interface MonthGridProps {
  monthDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
  setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
  preset: PresetType;
  setPreset: React.Dispatch<React.SetStateAction<PresetType>>;
  isRange: boolean;
  color: string;
  isDark: boolean;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  disableDaySelection?: boolean;
}

export default function MonthGrid({
  monthDate,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  preset,
  setPreset,
  isRange,
  color,
  isDark,
  weekStartsOn,
  disableDaySelection,
}: MonthGridProps) {
  const monthStart = startOfMonth(monthDate);
  const startDateGrid = startOfWeek(monthStart, { weekStartsOn });
  // Always 6 weeks: any month fits, and the grid height never jumps.
  const endDateGrid = addDays(startDateGrid, 41);
  const days = eachDayOfInterval({ start: startDateGrid, end: endDateGrid });

  const handleDateClick = (day: Date) => {
    if (disableDaySelection) return;
    if (preset !== "custom") {
      setPreset("custom");
      setStartDate(day);
      setEndDate(null);
      return;
    }

    if (!isRange) {
      setStartDate(day);
      setEndDate(null);
      return;
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (isBefore(day, startDate)) {
      setStartDate(day);
    } else {
      setEndDate(day);
    }
  };

  return (
    <div className="grid grid-cols-7 gap-y-1">
      {days.map((day, idx) => (
        <DayCell
          key={idx}
          day={day}
          monthStart={monthStart}
          startDate={startDate}
          endDate={endDate}
          onClick={disableDaySelection ? undefined : () => handleDateClick(day)}
          isRange={isRange}
          preset={preset}
          color={color}
          isDark={isDark}
          disableDaySelection={disableDaySelection}
        />
      ))}
    </div>
  );
}
