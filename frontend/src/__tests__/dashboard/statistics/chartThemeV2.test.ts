import { describe, it, expect } from "vitest";
import {
  gridSxV2,
  resolveV2ChartColors,
  tooltipSxV2,
} from "../../../dashboard/statistics/chartTheme.ts";

describe("resolveV2ChartColors", () => {
  it("builds CSS colours from the token triplets", () => {
    const tokens: Record<string, string> = {
      "--v2-income": "10 20 30",
      "--v2-expense-mark": "40 50 60",
      "--text-primary": "70 80 90",
      "--border-primary": "100 110 120",
      "--text-faint": "130 140 150",
      "--v2-warn-fill": "160 170 180",
      "--v2-danger": "190 200 210",
      "--text-muted": "220 230 240",
      "--v2-kept": "250 10 20",
    };
    expect(resolveV2ChartColors((n) => tokens[n])).toEqual({
      kept: "rgb(250 10 20)",
      income: "rgb(10 20 30)",
      expense: "rgb(40 50 60)",
      balance: "rgb(70 80 90 / 0.6)",
      grid: "rgb(100 110 120)",
      axis: "rgb(130 140 150)",
      warn: "rgb(160 170 180)",
      danger: "rgb(190 200 210)",
      // 40 50 60 * 0.78 = 31.2 39 46.8 → 31 39 47
      subscription: "rgb(31 39 47)",
      neutral: "rgb(220 230 240)",
    });
  });

  it("falls back to the light tokens when a variable is not set", () => {
    const colors = resolveV2ChartColors(() => "");
    expect(colors.income).toBe("rgb(47 143 85)");
    expect(colors.expense).toBe("rgb(236 138 118)");
    expect(colors.balance).toBe("rgb(28 26 23 / 0.6)");
    expect(colors.warn).toBe("rgb(240 160 32)");
    expect(colors.danger).toBe("rgb(196 65 47)");
    // 236 138 118 * 0.78 = 184.08 107.64 92.04 → 184 108 92
    expect(colors.subscription).toBe("rgb(184 108 92)");
    expect(colors.neutral).toBe("rgb(120 113 108)");
    expect(colors.kept).toBe("rgb(52 120 198)");
  });
});

describe("v2 chart styling", () => {
  it("uses the surface card and hairline ring for the tooltip", () => {
    const paper = tooltipSxV2["& .MuiChartsTooltip-paper"];
    expect(paper.backgroundColor).toBe("var(--color-app-card)");
    expect(paper.boxShadow).toContain("var(--box-ring)");
  });

  it("uses the input radius for the tooltip card", () => {
    expect(tooltipSxV2["& .MuiChartsTooltip-paper"].borderRadius).toBe(
      "var(--r-input)",
    );
  });

  it("recolours only the grid lines", () => {
    expect(gridSxV2("rgb(1 2 3)")).toEqual({
      "& .MuiChartsGrid-line": { stroke: "rgb(1 2 3)" },
    });
  });
});
