import type { Budget } from "../../utils/types";

/** Soft 400-tint status palette (house chart-colour rule: no saturated 500s). */
export const STATUS_META: Record<
  Budget["status"],
  { color: string; label: string }
> = {
  OK: { color: "#34d399", label: "On track" },
  WARNING: { color: "#fbbf24", label: "Near limit" },
  EXCEEDED: { color: "#f87171", label: "Over budget" },
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
