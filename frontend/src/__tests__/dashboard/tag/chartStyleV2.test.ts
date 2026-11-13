import { describe, it, expect } from "vitest";
import {
  categoryGapForMaxBar,
  formatCompactAxis,
  heatmapRamp,
} from "../../../dashboard/tag/chartStyleV2";

describe("heatmapRamp", () => {
  it("maps the scale ends to the lowest and highest wallet tint", () => {
    expect(heatmapRamp(0)).toBe(
      "color-mix(in srgb, var(--wallet) 10%, transparent)",
    );
    expect(heatmapRamp(1)).toBe(
      "color-mix(in srgb, var(--wallet) 95%, transparent)",
    );
  });

  it("clamps out-of-range inputs", () => {
    expect(heatmapRamp(-3)).toContain("10%");
    expect(heatmapRamp(9)).toContain("95%");
  });
});

describe("formatCompactAxis", () => {
  it("abbreviates thousands with a lowercase k", () => {
    expect(formatCompactAxis(8000)).toBe("8k");
    expect(formatCompactAxis(1500)).toBe("1.5k");
    expect(formatCompactAxis(0)).toBe("0");
  });

  it("keeps null as an empty label", () => {
    expect(formatCompactAxis(null)).toBe("");
  });
});

describe("categoryGapForMaxBar", () => {
  it("caps a single bar at 48px by widening the gap", () => {
    // one band of 600px: bar = 600 * (1 - gap) must be <= 48
    const gap = categoryGapForMaxBar(600, 1);
    expect(600 * (1 - gap)).toBeCloseTo(48);
  });

  it("keeps MUI's default gap when bars are already narrow", () => {
    expect(categoryGapForMaxBar(600, 12)).toBe(0.2);
  });

  it("falls back to the default without a measured width or categories", () => {
    expect(categoryGapForMaxBar(0, 3)).toBe(0.2);
    expect(categoryGapForMaxBar(600, 0)).toBe(0.2);
  });
});
