import React from "react";
import Skeleton from "@mui/material/Skeleton";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { useReducedMotion } from "framer-motion";

/*
 * v2 loading states for the Categories tab. Charts receive these through their
 * `loading` / `slots.loadingOverlay` props; lists render them directly.
 * Component-only module: keep constants and helpers private.
 */

const SKELETON_BG = "var(--color-app-raised)";

/** Pulses unless the user prefers reduced motion (then a static block). */
function useSkeletonAnimation(): "pulse" | false {
  const reduce = useReducedMotion();
  return reduce ? false : "pulse";
}

/** Share of the donut's diameter that is hole (matches the pie's 50px inner / 160px outer radius). */
const PIE_HOLE_RATIO = 50 / 160;

/** Donut placeholder: a pulsing ring with the hole cut out, centred in the drawing area. */
export function PieLoadingSkeleton(): React.ReactElement {
  const animation = useSkeletonAnimation();
  const { width, height, left, top } = useDrawingArea();
  const size = Math.min(width, height);
  const holeInset = ((1 - PIE_HOLE_RATIO) / 2) * 100;
  return (
    <foreignObject
      x={left + (width - size) / 2}
      y={top + (height - size) / 2}
      width={size}
      height={size}
      pointerEvents="none"
    >
      <div className="relative h-full w-full">
        <Skeleton
          variant="circular"
          animation={animation}
          width="100%"
          height="100%"
          sx={{ bgcolor: SKELETON_BG }}
        />
        <div
          className="absolute rounded-full bg-app-card"
          style={{
            inset: `${holeInset}%`,
          }}
        />
      </div>
    </foreignObject>
  );
}

/** Heights (% of the plot) of the placeholder bars: varied, so it reads as a trend. */
const BAR_HEIGHTS = [42, 66, 34, 80, 56, 92, 48, 72, 38, 62];

/** Trend placeholder: skeleton columns with rounded tops inside the plot area. */
export function BarsLoadingSkeleton(): React.ReactElement {
  const animation = useSkeletonAnimation();
  const { width, height, left, top } = useDrawingArea();
  return (
    <foreignObject
      x={left}
      y={top}
      width={width}
      height={height}
      pointerEvents="none"
    >
      <div className="flex h-full w-full items-end justify-around gap-2 px-2">
        {BAR_HEIGHTS.map((pct, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            animation={animation}
            width="100%"
            height={`${pct}%`}
            sx={{
              bgcolor: SKELETON_BG,
              maxWidth: 40,
              borderRadius: "4px 4px 0 0",
            }}
          />
        ))}
      </div>
    </foreignObject>
  );
}

/** Heatmap placeholder: a grid of small cells over the plot area. */
export function HeatmapLoadingSkeleton(): React.ReactElement {
  const animation = useSkeletonAnimation();
  const { width, height, left, top } = useDrawingArea();
  const COLS = 12;
  const ROWS = 5;
  return (
    <foreignObject
      x={left}
      y={top}
      width={width}
      height={height}
      pointerEvents="none"
    >
      <div
        className="grid h-full w-full gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            animation={animation}
            width="100%"
            height="100%"
            sx={{ bgcolor: SKELETON_BG, borderRadius: "3px" }}
          />
        ))}
      </div>
    </foreignObject>
  );
}

/** Ranking placeholder: rows shaped like RankRowV2 (icon tile · name · amount · track). */
export function RankRowsLoadingSkeleton({
  rows = 5,
}: {
  rows?: number;
}): React.ReactElement {
  const animation = useSkeletonAnimation();
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3"
        >
          <Skeleton
            variant="rounded"
            animation={animation}
            width={32}
            height={32}
            sx={{ bgcolor: SKELETON_BG, borderRadius: "9px" }}
          />
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Skeleton
                variant="text"
                animation={animation}
                width="40%"
                sx={{ bgcolor: SKELETON_BG }}
              />
              <Skeleton
                variant="text"
                animation={animation}
                width={72}
                sx={{ bgcolor: SKELETON_BG }}
              />
            </div>
            <Skeleton
              variant="rounded"
              animation={animation}
              width="100%"
              height={6}
              sx={{ bgcolor: SKELETON_BG, mt: 0.75 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Strip placeholder: pill-shaped chips where the top categories will be. */
export function StripChipsLoadingSkeleton(): React.ReactElement {
  const animation = useSkeletonAnimation();
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-busy="true">
      {[96, 84, 110, 88].map((w, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          animation={animation}
          width={w}
          height={26}
          sx={{ bgcolor: SKELETON_BG, borderRadius: "9999px" }}
        />
      ))}
    </div>
  );
}

/** Legend placeholder: small text lines in place of the series labels. */
export function LegendLoadingSkeleton(): React.ReactElement {
  const animation = useSkeletonAnimation();
  return (
    <>
      {[64, 52, 72, 58].map((w, i) => (
        <Skeleton
          key={i}
          variant="text"
          animation={animation}
          width={w}
          sx={{ bgcolor: SKELETON_BG }}
        />
      ))}
    </>
  );
}
