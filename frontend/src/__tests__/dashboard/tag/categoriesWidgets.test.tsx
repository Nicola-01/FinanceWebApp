import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { Transaction } from "../../../types/domain";
import {
  CATEGORIES_WIDGETS,
  type CategoriesWidgetCtx,
} from "../../../dashboard/tag/categoriesWidgets";

// Capture the props the Cash Flow widget hands to the lazy Sankey.
const { sankeyProps } = vi.hoisted(() => ({
  sankeyProps: { current: null as Record<string, unknown> | null },
}));
vi.mock("../../../dashboard/statistics/LazyCashFlowSankey.tsx", () => ({
  LazyCashFlowSankey: (props: Record<string, unknown>) => {
    sankeyProps.current = props;
    return null;
  },
}));

describe("CATEGORIES_WIDGETS", () => {
  it("passes the wallet's investment tags to the Cash Flow Sankey", () => {
    const investmentTags = new Set(["PAC"]);
    const ctx: CategoriesWidgetCtx = {
      transactions: [] as Transaction[],
      currencyCode: "EUR",
      currencySymbol: "€",
      investmentTags,
      loading: false,
    };
    const sankey = CATEGORIES_WIDGETS.find((w) => w.id === "sankey");
    render(<>{sankey!.render(ctx, false)}</>);
    expect(sankeyProps.current?.investmentTags).toBe(investmentTags);
  });
});
