import { useState } from "react";
import type { ZoomData } from "@mui/x-charts/internals";
import { recentMonthsZoom } from "../../utils/recentMonthsZoom.ts";

/**
 * Controlled zoom state for a month-based x-axis (id "x-axis") that preselects the most
 * recent ~12 months. `periods` is the ordered list of month labels currently plotted; when
 * that range changes (data finishes loading, wallet/flow switch) the window re-preselects,
 * while ordinary re-renders and the user's own panning are left untouched.
 */
export function useRecentMonthsZoom(periods: readonly string[]) {
  const [zoomData, setZoomData] = useState<ZoomData[]>(() =>
    recentMonthsZoom(periods.length),
  );

  const rangeKey =
    periods.length > 0
      ? `${periods.length}:${periods[0]}:${periods[periods.length - 1]}`
      : "";

  // Re-frame the recent window when the plotted range changes — done during render
  // (React's "adjust state on prop change" pattern) rather than in an effect.
  const [framedFor, setFramedFor] = useState(rangeKey);
  if (rangeKey && rangeKey !== framedFor) {
    setFramedFor(rangeKey);
    setZoomData(recentMonthsZoom(periods.length));
  }

  return [zoomData, setZoomData] as const;
}
