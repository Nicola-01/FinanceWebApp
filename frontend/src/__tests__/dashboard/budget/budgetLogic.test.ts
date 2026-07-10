import { describe, expect, it } from "vitest";
import {
  STATUS_META,
  barPercent,
  periodLabel,
  validateThresholds,
} from "../../../dashboard/budget/budgetLogic";
import type { Budget } from "../../../utils/types";

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
