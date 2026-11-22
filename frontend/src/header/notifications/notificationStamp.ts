import { format, isToday, isYesterday } from "date-fns";

/** v2 row stamp: "Today, 09:14", "Yesterday, 18:02", else "3 Nov, 09:14". */
export const stampLabel = (d: Date): string => {
  const time = format(d, "HH:mm");
  if (isToday(d)) return `Today, ${time}`;
  if (isYesterday(d)) return `Yesterday, ${time}`;
  return `${format(d, "d MMM")}, ${time}`;
};
