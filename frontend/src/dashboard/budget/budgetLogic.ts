import type { Budget } from "../../types/domain";

/** Soft 400-tint status palette (house chart-colour rule: no saturated 500s). */
export const STATUS_META: Record<
  Budget["status"],
  { color: string; label: string }
> = {
  OK: { color: "#34d399", label: "On track" },
  WARNING: { color: "#fbbf24", label: "Near limit" },
  EXCEEDED: { color: "#f87171", label: "Over budget" },
  GOAL_REACHED: { color: "#34d399", label: "Goal reached" },
};

export function periodLabel(budget: Budget): string {
  switch (budget.periodType) {
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    case "YEARLY":
      return "Yearly";
    case "CUSTOM": {
      const fmt = (iso: string) =>
        new Date(iso).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      return `${fmt(budget.startDate)} – ${fmt(budget.endDate ?? budget.startDate)}`;
    }
  }
}

/** Progress-bar width: percentUsed clamped to [0, 100]. */
export function barPercent(budget: Budget): number {
  return Math.max(0, Math.min(budget.percentUsed, 100));
}

/** Mirror of the backend rules. Returns an error message, or null when valid. */
export function validateThresholds(thresholds: number[]): string | null {
  if (thresholds.length > 5) return "At most 5 thresholds.";
  if (thresholds.some((t) => !Number.isInteger(t) || t < 1 || t > 200))
    return "Thresholds must be whole numbers between 1 and 200.";
  if (new Set(thresholds).size !== thresholds.length)
    return "Thresholds must be unique.";
  return null;
}

/** v2 StatusPill / ProgressBar tone for each backend status (same thresholds as v1). */
export const STATUS_TONE: Record<Budget["status"], "ok" | "warn" | "danger"> = {
  OK: "ok",
  WARNING: "warn",
  EXCEEDED: "danger",
  GOAL_REACHED: "ok",
};

/** v2 gauge value-arc fill per status, as CSS (SVG `fill` set via CSS resolves var()). */
export const GAUGE_FILL: Record<"ok" | "warn" | "danger", string> = {
  ok: "var(--color-app-income)",
  warn: "var(--color-app-warn-fill)",
  danger: "var(--color-app-danger)",
};

/** Gauge value-arc colour for a budget status. */
export function gaugeColor(status: Budget["status"]): string {
  return GAUGE_FILL[STATUS_TONE[status]];
}

/** Gauge centre number format: compact above 1000 so a huge overspend ("22K%") still fits. */
export function gaugeNumberFormat(percentUsed: number): {
  maximumFractionDigits: number;
  notation: "standard" | "compact";
} {
  return {
    maximumFractionDigits: 0,
    notation: percentUsed > 1000 ? "compact" : "standard",
  };
}

/** Gauge centre text: the real percentage, compact above 1000 (e.g. "22K%"). */
export function gaugeCenterText(percentUsed: number): string {
  return `${new Intl.NumberFormat(undefined, gaugeNumberFormat(percentUsed)).format(percentUsed)}%`;
}

/** Accessible name for the v2 gauge; shows the real percentage, even above 100. */
export function gaugeAriaLabel(budget: Budget): string {
  return `Budget used: ${budget.percentUsed}%`;
}

/** v2 header status label; the overspend amount is shown in the gauge area, not here. */
export const STATUS_TEXT_V2: Record<Budget["status"], string> = {
  OK: "On track",
  WARNING: "Close to the limit",
  EXCEEDED: "Over budget",
  GOAL_REACHED: "Goal reached",
};

/** Whole days from `today` to the budget's period end (0 once the period has ended). */
export function daysLeft(budget: Budget, today: Date = new Date()): number {
  const [y, m, d] = budget.periodEnd.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 86_400_000),
  );
}

/** One alert tick on the v2 gauge arc: radial segment in a 100x100 box, plus whether it has been passed. */
export interface AlertTick {
  pct: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  passed: boolean;
}

/** Point on the 270° gauge arc (start 135°, clockwise) at `pct` of the scale, in the 100x100 box. */
export function arcPoint(pct: number, radius: number): [number, number] {
  const angle = ((135 + (270 * pct) / 100) * Math.PI) / 180;
  return [50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius];
}

/**
 * Ticks at each alert threshold on the 270° arc (start 135°, clockwise, as the
 * Gauge draws it). Thresholds above 100 pin to the end; duplicates collapse.
 */
export function gaugeAlertTicks(
  thresholds: number[],
  percentUsed: number,
): AlertTick[] {
  const pcts = [
    ...new Set(thresholds.map((t) => Math.min(100, Math.max(0, t)))),
  ];
  return pcts.map((pct) => {
    const [x1, y1] = arcPoint(pct, 34);
    const [x2, y2] = arcPoint(pct, 46);
    return { pct, x1, y1, x2, y2, passed: percentUsed >= pct };
  });
}

const DAY_MS = 86_400_000;

/**
 * Projected committed spend at period end: spend to date extrapolated linearly
 * over the period, plus subscriptions still due (the mock's "about 1.074 €").
 */
export function projectedCommitted(
  budget: Budget,
  upcoming: number,
  today: Date = new Date(),
): number {
  const localDay = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  const start = localDay(budget.periodStart);
  const total = Math.round((localDay(budget.periodEnd) - start) / DAY_MS) + 1;
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const elapsed = Math.min(
    total,
    Math.max(1, Math.round((todayStart - start) / DAY_MS) + 1),
  );
  return (budget.spent / elapsed) * total + upcoming;
}
