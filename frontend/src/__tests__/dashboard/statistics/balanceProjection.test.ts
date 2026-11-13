import { describe, it, expect } from "vitest";
import {
  projectBalance,
  horizonMonths,
} from "../../../dashboard/statistics/balanceProjection.ts";

/** Builds a history from a starting balance and a list of monthly nets (first month = start). */
function history(start: number, nets: number[]) {
  const out: { date: Date; balance: number }[] = [];
  let balance = start;
  out.push({ date: new Date(2026, 0, 1), balance });
  nets.forEach((n, i) => {
    balance += n;
    out.push({ date: new Date(2026, i + 1, 1), balance });
  });
  return out;
}

describe("projectBalance", () => {
  it("returns null with fewer than 3 history months", () => {
    expect(projectBalance(history(1000, [50]), 12)).toBeNull();
    expect(projectBalance([], 12)).toBeNull();
  });

  it("uses the median net, so a single outlier month does not move the pace", () => {
    const result = projectBalance(history(0, [400, 410, 390, -9000, 405]), 3);
    expect(result).not.toBeNull();
    expect(result!.pace).toBe(400);
  });

  it("averages the two middle nets for an even count", () => {
    const result = projectBalance(history(0, [100, 300]), 1);
    expect(result!.pace).toBe(200);
  });

  it("widens the band as the horizon grows", () => {
    const result = projectBalance(history(1000, [100, 120, 80, 110, 90]), 12)!;
    const widths = result.rows
      .slice(-12)
      .map((r) => (r.high ?? 0) - (r.low ?? 0));
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThan(widths[i - 1]);
    }
  });

  it("falls back to 10% of the pace when the MAD is zero", () => {
    const result = projectBalance(history(0, [200, 200, 200]), 4)!;
    const last = result.rows[result.rows.length - 1];
    // sigma = 0.1 * 200 = 20; band at k=4 = 1.28 * 20 * 2
    expect(last.high! - last.projected!).toBeCloseTo(1.28 * 20 * 2, 6);
  });

  it("has zero band when pace and sigma are both zero", () => {
    const result = projectBalance(history(500, [0, 0, 0]), 2)!;
    expect(result.end).toBe(500);
    expect(result.endLow).toBe(500);
    expect(result.endHigh).toBe(500);
  });

  it("starts the projection on the last real row and produces history + horizon rows", () => {
    const hist = history(1000, [100, 120, 80]);
    const result = projectBalance(hist, 5)!;
    expect(result.rows).toHaveLength(hist.length + 5);

    const lastReal = result.rows[hist.length - 1];
    expect(lastReal.balance).toBe(1300);
    expect(lastReal.projected).toBe(1300);
    expect(lastReal.low).toBe(1300);
    expect(lastReal.high).toBe(1300);

    const firstProjected = result.rows[hist.length];
    expect(firstProjected.balance).toBeUndefined();
    expect(firstProjected.projected).toBe(1300 + result.pace);
  });

  it("projects with pace per month and ends at endDate = last row date", () => {
    const hist = history(0, [100, 100, 100]);
    const result = projectBalance(hist, 6)!;
    expect(result.pace).toBe(100);
    expect(result.end).toBe(300 + 100 * 6);
    // last history month is April 2026; 6 months ahead is October
    expect(result.endDate).toEqual(new Date(2026, 9, 1));
    expect(result.rows[result.rows.length - 1].date).toEqual(result.endDate);
  });
});

describe("horizonMonths", () => {
  it("counts months to December for eoy", () => {
    expect(horizonMonths(new Date(2026, 9, 1), "eoy")).toBe(2);
  });

  it("returns at least 1 for eoy from December", () => {
    expect(horizonMonths(new Date(2026, 11, 1), "eoy")).toBe(1);
  });

  it("maps fixed horizons to months", () => {
    const d = new Date(2026, 3, 1);
    expect(horizonMonths(d, "1y")).toBe(12);
    expect(horizonMonths(d, "3y")).toBe(36);
    expect(horizonMonths(d, "5y")).toBe(60);
  });
});
