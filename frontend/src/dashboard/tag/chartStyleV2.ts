/**
 * v2 chart styling for the Categories tab (MUI X-Charts). Values are CSS vars so the
 * charts follow the light/dark tokens and the wallet accent without re-rendering.
 */

/** Axis labels: faint, 12px, no axis line or ticks (see style.md §8 Charts). */
export const V2_AXIS = {
  disableLine: true,
  disableTicks: true,
  tickLabelStyle: { fill: "rgb(var(--text-faint))", fontSize: 12 },
} as const;

/** Recessive horizontal grid, dashed. */
export const V2_GRID_SX = {
  "& .MuiChartsGrid-line": {
    stroke: "rgb(var(--border-primary))",
    strokeDasharray: "3 3",
  },
} as const;

/** Compact y-axis label: 8000 -> "8k", 1200000 -> "1.2M". */
const compactFormat = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
export const formatCompactAxis = (v: number | null): string =>
  v == null ? "" : compactFormat.format(v).replace("K", "k");

/**
 * Bar-gap ratio that keeps a bar at most `maxBar` px wide when there are few categories
 * (a bar fills its band otherwise). Falls back to MUI's default 0.2 when bars are narrow.
 */
export const categoryGapForMaxBar = (
  plotWidth: number,
  count: number,
  maxBar = 48,
): number => {
  if (count <= 0 || plotWidth <= 0) return 0.2;
  const band = plotWidth / count;
  return Math.max(0.2, 1 - Math.min(1, maxBar / band));
};

/** Few months are plotted without the zoom slider (see CategoryTrendChart). */
export const V2_ZOOM_MIN_MONTHS = 7;

/**
 * Zoom slider, thin: 4px raised track, 12px circular thumb. The thumb keeps MUI's
 * x-position maths, so it may sit ~1px off the track centre.
 */
export const V2_ZOOM_SLIDER_SX = {
  "& .MuiChartAxisZoomSliderTrack-background": {
    height: 4,
    fill: "var(--color-app-raised)",
  },
  "& .MuiChartAxisZoomSliderTrack-active": {
    height: 4,
    fill: "var(--color-app-muted)",
  },
  "& .MuiChartAxisZoomSliderThumb-root": {
    width: 12,
    height: 12,
    rx: 6,
    fill: "var(--color-app-text)",
  },
} as const;

/** Heatmap ramp: wallet-tinted cell, 10% (lowest) to 95% (highest) opacity. */
export const heatmapRamp = (t: number): string =>
  `color-mix(in srgb, var(--wallet) ${Math.round(10 + Math.min(Math.max(t, 0), 1) * 85)}%, transparent)`;
