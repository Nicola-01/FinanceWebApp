import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { setUiVersion } from "../../../utils/uiVersion";
import { CategoryRanking } from "../../../dashboard/tag/CategoryRanking";
import { CategoryStrip } from "../../../dashboard/tag/CategoryStrip";
import { CategoryTrendChart } from "../../../dashboard/tag/CategoryTrendChart";
import { CategoryHeatmapChart } from "../../../dashboard/tag/CategoryHeatmapChart";
import { TransactionPieChart } from "../../../dashboard/tag/TransactionPieChart";
import type { Tag, Transaction } from "../../../types/domain";
import { ThemeContext } from "../../../utils/ThemeContext";

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));
vi.mock("../../../dashboard/wallet/useInvestmentTags", () => ({
  useInvestmentTags: () => new Set<string>(),
}));

const withTheme = (ui: React.ReactElement) => (
  <ThemeContext.Provider
    value={{ theme: "light", setTheme: vi.fn(), resolvedTheme: "light" }}
  >
    {ui}
  </ThemeContext.Provider>
);

const skeletons = (container: HTMLElement) =>
  container.querySelectorAll(".MuiSkeleton-root").length;

const food: Tag = {
  name: "Food",
  icon: "tag",
  colorHex: "#f0b85a",
  parentName: null,
};
const tag = (name: string, amount: number): Transaction =>
  ({
    id: name,
    name,
    amount,
    type: "EXPENSE",
    transactionDate: "2026-10-01",
    tag: { ...food, name },
  }) as unknown as Transaction;

describe("Categories loading state (v2)", () => {
  afterEach(() => setUiVersion("v1"));

  it("the ranking shows skeleton rows instead of the no-data text", () => {
    setUiVersion("v2");
    const { container } = render(
      <CategoryRanking
        transactions={[]}
        type="EXPENSE"
        title="Top Expense Categories"
        currency="€"
        loading
      />,
    );
    // 5 rows x (icon tile + name + amount + track)
    expect(skeletons(container)).toBe(5 * 4);
    expect(screen.queryByText(/data available/)).not.toBeInTheDocument();
  });

  it("the ranking keeps its no-data text when not loading", () => {
    setUiVersion("v2");
    const { container } = render(
      <CategoryRanking
        transactions={[]}
        type="EXPENSE"
        title="Top Expense Categories"
        currency="€"
      />,
    );
    expect(skeletons(container)).toBe(0);
    expect(
      screen.getByText("No top expense categories data available."),
    ).toBeInTheDocument();
  });

  it("the strip shows skeleton chips instead of 'No spending'", () => {
    setUiVersion("v2");
    const { container } = render(
      <CategoryStrip
        transactions={[]}
        tags={[food]}
        invest={new Set()}
        onManage={vi.fn()}
        loading
      />,
    );
    expect(skeletons(container)).toBe(4);
    expect(screen.queryByText("No spending in this period")).toBeNull();
  });

  it("the pie draws the donut skeleton and no centre total or empty text", () => {
    setUiVersion("v2");
    const { container } = render(
      withTheme(
        <TransactionPieChart
          transactions={[]}
          type="INCOME"
          title="Income Distribution"
          currency="EUR"
          loading
        />,
      ),
    );
    expect(skeletons(container)).toBeGreaterThan(0);
    expect(screen.queryByText(/data available/)).not.toBeInTheDocument();
    expect(screen.queryByText("earned")).not.toBeInTheDocument();
  });

  it("the trend draws bar skeletons and a legend skeleton, not the empty card", () => {
    setUiVersion("v2");
    const { container } = render(
      <CategoryTrendChart transactions={[]} currency="€" loading />,
    );
    // 10 bars + 4 legend lines
    expect(skeletons(container)).toBeGreaterThanOrEqual(14);
    expect(screen.queryByText("No data available.")).not.toBeInTheDocument();
  });

  it("the heatmap draws the cell-grid skeleton, not the empty card", () => {
    setUiVersion("v2");
    const { container } = render(
      <CategoryHeatmapChart transactions={[]} currency="€" loading />,
    );
    // 12 x 5 cells
    expect(skeletons(container)).toBeGreaterThanOrEqual(60);
    expect(screen.queryByText("No data available.")).not.toBeInTheDocument();
  });

  it("the charts show their normal empty state when not loading", () => {
    setUiVersion("v2");
    render(<CategoryTrendChart transactions={[]} currency="€" />);
    expect(screen.getByText("No data available.")).toBeInTheDocument();
  });

  it("a loaded list with data renders real rows, not skeletons", () => {
    setUiVersion("v2");
    const { container } = render(
      <CategoryRanking
        transactions={[tag("Food", 75), tag("Rent", 25)]}
        type="EXPENSE"
        title="Top Expense Categories"
        currency="€"
        loading={false}
      />,
    );
    expect(skeletons(container)).toBe(0);
    expect(screen.getByText("Food")).toBeInTheDocument();
  });
});
