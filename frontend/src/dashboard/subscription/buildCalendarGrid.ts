import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";

const BASE_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Month grid for `date`: always 42 days (6 rows) starting on `weekStartsOn`,
 * plus the month bounds and the rotated weekday labels.
 */
export function buildCalendarGrid(
  date: Date,
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn });
  const endDate = endOfWeek(monthEnd, { weekStartsOn });

  const calendarDays: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }
  // Always render exactly 6 rows (42 cells) for consistent calendar height
  while (calendarDays.length < 42) {
    calendarDays.push(addDays(calendarDays[calendarDays.length - 1], 1));
  }

  const weekDays = [
    ...BASE_DAYS.slice(weekStartsOn),
    ...BASE_DAYS.slice(0, weekStartsOn),
  ];

  return { monthStart, monthEnd, calendarDays, weekDays };
}
