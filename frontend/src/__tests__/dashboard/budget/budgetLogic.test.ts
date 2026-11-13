import { describe, expect, it } from "vitest";
import {
  STATUS_META,
  STATUS_TONE,
  barPercent,
  daysLeft,
  daysLeftInMonth,
  gaugeAriaLabel,
  gaugeCenterText,
  gaugeColor,
  gaugeNumberFormat,
  monthAside,
  periodLabel,
  validateThresholds,
} from "../../../dashboard/budget/budgetLogic";
import type { Budget } from "../../../types/domain";

const base: Budget = {
  id: "b1",
  name: "Food budget",
  tagName: "Food",
  limitAmount: 300,
  periodType: "MONTHLY",
  startDate: "2026-07-01",
  endDate: null,
  rollover: false,
  alertThresholds: [80, 100],
  periodStart: "2026-07-01",
  periodEnd: "2026-07-31",
  spent: 150,
  effectiveLimit: 300,
  remaining: 150,
  percentUsed: 50,
  status: "OK",
  crossedThresholds: [],
  active: true,
};

describe("periodLabel", () => {
  it("labels recurring periods", () => {
    expect(periodLabel(base)).toBe("Monthly");
    expect(periodLabel({ ...base, periodType: "WEEKLY" })).toBe("Weekly");
    expect(periodLabel({ ...base, periodType: "YEARLY" })).toBe("Yearly");
  });

  it("renders the custom range with both dates", () => {
    const label = periodLabel({
      ...base,
      periodType: "CUSTOM",
      startDate: "2026-06-01",
      endDate: "2026-08-31",
    });
    expect(label).toContain("2026");
    expect(label).toContain("–");
  });
});

describe("barPercent", () => {
  it("passes through in-range values and clamps overflow", () => {
    expect(barPercent(base)).toBe(50);
    expect(barPercent({ ...base, percentUsed: 130 })).toBe(100);
    expect(barPercent({ ...base, percentUsed: -5 })).toBe(0);
  });
});

describe("validateThresholds", () => {
  it("accepts a valid set and the empty set", () => {
    expect(validateThresholds([80, 100])).toBeNull();
    expect(validateThresholds([])).toBeNull();
  });
  it("rejects out-of-range, duplicates and more than 5", () => {
    expect(validateThresholds([0])).not.toBeNull();
    expect(validateThresholds([201])).not.toBeNull();
    expect(validateThresholds([50, 50])).not.toBeNull();
    expect(validateThresholds([10, 20, 30, 40, 50, 60])).not.toBeNull();
    expect(validateThresholds([80.5])).not.toBeNull();
  });
});

describe("STATUS_META", () => {
  it("uses the soft-tint palette", () => {
    expect(STATUS_META.OK.color).toBe("#34d399");
    expect(STATUS_META.WARNING.color).toBe("#fbbf24");
    expect(STATUS_META.EXCEEDED.color).toBe("#f87171");
  });
});

describe("v2 helpers", () => {
  it("maps backend status to the StatusPill tone", () => {
    expect(STATUS_TONE).toEqual({
      OK: "ok",
      WARNING: "warn",
      EXCEEDED: "danger",
    });
  });

  it("counts whole days from today to the period end", () => {
    const budget = { ...base, periodEnd: "2026-07-31" };
    expect(daysLeft(budget, new Date(2026, 6, 29, 15))).toBe(2);
    expect(daysLeft(budget, new Date(2026, 6, 31))).toBe(0);
    expect(daysLeft(budget, new Date(2026, 7, 2))).toBe(0);
  });

  it("counts days left in the calendar month", () => {
    expect(daysLeftInMonth(new Date(2026, 9, 29))).toBe(2);
    expect(daysLeftInMonth(new Date(2026, 9, 31))).toBe(0);
    expect(monthAside(new Date(2026, 9, 29))).toMatch(/2 days left$/);
  });
});

describe("gauge helpers", () => {
  it("maps each status to its arc colour token", () => {
    expect(gaugeColor("OK")).toBe("var(--color-app-income)");
    expect(gaugeColor("WARNING")).toBe("var(--color-app-warn-fill)");
    expect(gaugeColor("EXCEEDED")).toBe("var(--color-app-danger)");
  });

  it("labels the gauge with the real percentage, even above 100", () => {
    expect(gaugeAriaLabel({ ...base, percentUsed: 86 })).toBe(
      "Budget used: 86%",
    );
    expect(gaugeAriaLabel({ ...base, percentUsed: 133 })).toBe(
      "Budget used: 133%",
    );
  });

  it("formats the centre number compact only above 1000%", () => {
    expect(gaugeNumberFormat(83)).toEqual({
      maximumFractionDigits: 0,
      notation: "standard",
    });
    expect(gaugeNumberFormat(1000).notation).toBe("standard");
    expect(gaugeNumberFormat(1001).notation).toBe("compact");
    expect(gaugeNumberFormat(22416).notation).toBe("compact");
  });

  it("renders the centre text with the real percentage and a % sign", () => {
    expect(gaugeCenterText(83)).toBe("83%");
    // Locale-dependent compact form, so only the shape is asserted.
    expect(gaugeCenterText(22416)).toMatch(/%$/);
    expect(gaugeCenterText(22416)).not.toContain("22416");
  });
});
