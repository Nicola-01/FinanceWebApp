import { describe, it, expect } from "vitest";
import {
  STATISTICS_TAB_ID,
  STATISTICS_WIDGETS,
} from "../../../dashboard/statistics/statisticsWidgets.tsx";
import { defaultLayout } from "../../../utils/tabLayout/storage";

describe("STATISTICS_WIDGETS", () => {
  it("uses the statistics tab id", () => {
    expect(STATISTICS_TAB_ID).toBe("statistics");
  });

  // Month by month + Worth knowing are pinned above the grid (2/3 + 1/3), not widgets.
  it("lists the three customizable cards in the default order with their spans", () => {
    expect(STATISTICS_WIDGETS.map(({ id, span }) => [id, span])).toEqual([
      ["year-waterfall", "full"],
      ["balance-projection", "full"],
      ["numbers", "full"],
    ]);
  });

  it("starts every card visible and gives each a short label", () => {
    expect(STATISTICS_WIDGETS.some((w) => w.hiddenByDefault)).toBe(false);
    expect(STATISTICS_WIDGETS.map((w) => w.label)).toEqual([
      "Year",
      "Projection",
      "Numbers",
    ]);
  });

  it("builds a default layout with one standalone slot per card, in order", () => {
    expect(defaultLayout(STATISTICS_WIDGETS).slots.map((s) => s.id)).toEqual(
      STATISTICS_WIDGETS.map((w) => w.id),
    );
  });
});
