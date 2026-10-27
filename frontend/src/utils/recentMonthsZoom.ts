import type { ZoomData } from "@mui/x-charts/internals";

// How many trailing months the zoom slider frames by default.
export const RECENT_MONTHS = 12;

/** Zoom that frames the most recent `RECENT_MONTHS` of `monthCount` months on "x-axis". */
export const recentMonthsZoom = (monthCount: number): ZoomData[] => [
  {
    axisId: "x-axis",
    start:
      monthCount > RECENT_MONTHS
        ? ((monthCount - RECENT_MONTHS) / monthCount) * 100
        : 0,
    end: 100,
  },
];
