import { describe, it, expect } from "vitest";
import { RECENT_MONTHS, recentMonthsZoom } from "../../utils/recentMonthsZoom";

describe("recentMonthsZoom", () => {
  it("frames the whole axis when there is no data", () => {
    expect(recentMonthsZoom(0)).toEqual([
      { axisId: "x-axis", start: 0, end: 100 },
    ]);
  });

  it("frames the whole axis with fewer than RECENT_MONTHS months", () => {
    expect(recentMonthsZoom(5)).toEqual([
      { axisId: "x-axis", start: 0, end: 100 },
    ]);
  });

  it("frames the whole axis with exactly RECENT_MONTHS months", () => {
    expect(RECENT_MONTHS).toBe(12);
    expect(recentMonthsZoom(12)[0].start).toBe(0);
  });

  it("frames only the trailing 12 months when there are more", () => {
    expect(recentMonthsZoom(24)).toEqual([
      { axisId: "x-axis", start: 50, end: 100 },
    ]);
    expect(recentMonthsZoom(13)[0].start).toBeCloseTo((1 / 13) * 100);
  });
});
