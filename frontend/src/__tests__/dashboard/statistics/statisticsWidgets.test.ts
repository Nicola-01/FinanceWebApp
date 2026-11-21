import { describe, it, expect } from "vitest";
import {
  STATISTICS_TAB_ID,
  statisticsWidgetsFor,
} from "../../../dashboard/statistics/statisticsWidgets.tsx";
import { defaultLayout } from "../../../utils/tabLayout/storage";

describe("statisticsWidgetsFor", () => {
  const STATISTICS_WIDGETS = statisticsWidgetsFor(true);
  it("uses the statistics tab id", () => {
    expect(STATISTICS_TAB_ID).toBe("statistics");
  });

  // Month by month + Worth knowing are pinned above the grid (2/3 + 1/3), not widgets.
  it("lists the four customizable cards in the default order with their spans", () => {
    expect(STATISTICS_WIDGETS.map(({ id, span }) => [id, span])).toEqual([
      ["investments", "half"],
      ["year-waterfall", "full"],
      ["balance-projection", "full"],
      ["numbers", "full"],
    ]);
  });

  it("starts every card visible and gives each a short label", () => {
    expect(STATISTICS_WIDGETS.some((w) => w.hiddenByDefault)).toBe(false);
    expect(STATISTICS_WIDGETS.map((w) => w.label)).toEqual([
      "Investments",
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

  it("drops the investments card when no tag is flagged as investment", () => {
    const ids = statisticsWidgetsFor(false).map((w) => w.id);
    expect(ids).toEqual(["year-waterfall", "balance-projection", "numbers"]);
    expect(
      defaultLayout(statisticsWidgetsFor(false)).slots.map((s) => s.id),
    ).toEqual(ids);
  });
});
