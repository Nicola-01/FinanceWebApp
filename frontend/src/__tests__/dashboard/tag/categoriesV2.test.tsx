import { describe, it, expect, afterEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { setUiVersion } from "../../../utils/uiVersion";
import { ChartCard } from "../../../dashboard/tag/ChartCard";
import { FlowTypeToggle } from "../../../dashboard/tag/FlowTypeToggle";
import { CategoryRanking } from "../../../dashboard/tag/CategoryRanking";
import { TransactionPieChart } from "../../../dashboard/tag/TransactionPieChart";
import type { Transaction } from "../../../types/domain";
import { ThemeContext } from "../../../utils/ThemeContext";

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

// The ranking reads the wallet's investment tags through the hook; tests steer it via this set.
const { investTags } = vi.hoisted(() => ({
  investTags: new Set<string>(),
}));
vi.mock("../../../dashboard/wallet/useInvestmentTags", () => ({
  useInvestmentTags: () => investTags,
}));

const withTheme = (ui: React.ReactElement) => (
  <ThemeContext.Provider
    value={{ theme: "light", setTheme: vi.fn(), resolvedTheme: "light" }}
  >
    {ui}
  </ThemeContext.Provider>
);

const tx = (name: string, amount: number): Transaction =>
  ({
    id: name,
    name,
    amount,
    type: "EXPENSE",
    transactionDate: "2026-10-01",
    tag: { name, icon: "piggyBank", colorHex: "#22c55e", parentName: null },
  }) as unknown as Transaction;

describe("Categories tab (v2)", () => {
  afterEach(() => setUiVersion("v1"));

  it("ChartCard uses the display face and sentence case title", () => {
    setUiVersion("v2");
    render(
      <ChartCard
        title="Category Trend"
        subtitle="Sub"
        bare={false}
        controls={null}
        isEmpty={false}
        emptyMinHeightClass="min-h-[300px]"
      >
        <p>chart</p>
      </ChartCard>,
    );
    const heading = screen.getByRole("heading", { name: "Category trend" });
    expect(heading).toHaveClass("font-display", "font-semibold");
    expect(heading).not.toHaveClass("uppercase");
  });

  it("FlowTypeToggle gives the active Income segment the income colour", () => {
    setUiVersion("v2");
    const onChange = vi.fn();
    render(<FlowTypeToggle value="INCOME" onChange={onChange} />);
    expect(screen.getByRole("tab", { name: "Income" })).toHaveClass(
      "text-app-income",
    );
  });

  it("FlowTypeToggle keeps the inactive Income label in the income hue", () => {
    setUiVersion("v2");
    render(<FlowTypeToggle value="EXPENSE" onChange={vi.fn()} />);
    const income = screen.getByRole("tab", { name: "Income" });
    expect(income).toHaveClass("text-app-income", "opacity-70");
    expect(income.className).not.toContain("text-app-muted");
  });

  it("FlowTypeToggle keeps the v1 active colour", () => {
    setUiVersion("v1");
    render(<FlowTypeToggle value="INCOME" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Income" })).toHaveClass(
      "text-app-text",
    );
  });

  it("CategoryRanking v2 renders each tag with its share and a raised track", async () => {
    setUiVersion("v2");
    const { container } = render(
      <CategoryRanking
        transactions={[tx("Food", 75), tx("Rent", 25)]}
        type="EXPENSE"
        title="Top Expense Categories"
        currency="€"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Top expense categories" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(await screen.findByText("75%")).toBeInTheDocument();
    expect(container.querySelectorAll(".bg-app-raised.h-1\\.5").length).toBe(2);
  });

  it("TransactionPieChart v2 shows the centre caption for the flow type", () => {
    setUiVersion("v2");
    render(
      withTheme(
        <TransactionPieChart
          transactions={[tx("Food", 40)]}
          type="EXPENSE"
          title="Expense Distribution"
          currency="EUR"
          bare
        />,
      ),
    );
    expect(screen.getByText("spent")).toBeInTheDocument();
  });

  it("TransactionPieChart v2 renders the two-level pie with parent and sub-category labels", () => {
    setUiVersion("v2");
    const sub = (name: string, parent: string, amount: number) =>
      ({
        ...tx(name, amount),
        tag: {
          name,
          icon: "piggyBank",
          colorHex: "#22c55e",
          parentName: parent,
        },
      }) as unknown as Transaction;
    const { container } = render(
      withTheme(
        <TransactionPieChart
          transactions={[
            sub("Groceries", "Food", 40),
            sub("Restaurants", "Food", 20),
            tx("Rent", 60),
          ]}
          type="EXPENSE"
          title="Expense Distribution"
          currency="EUR"
          bare
        />,
      ),
    );
    // inner ring: parents (Food, Rent); outer ring: sub-categories (Groceries, Restaurants, Rent)
    expect(container.querySelectorAll(".MuiPieArc-root").length).toBe(5);
    const labels = Array.from(
      container.querySelectorAll(".MuiPieArcLabel-root"),
    ).map((el) => el.textContent);
    expect(labels).toEqual(
      expect.arrayContaining(["Food", "Groceries", "Restaurants", "Rent"]),
    );
  });

  it("TransactionPieChart v2 shows the centre total in the display face", () => {
    setUiVersion("v2");
    const { container } = render(
      withTheme(
        <TransactionPieChart
          transactions={[tx("Food", 1234)]}
          type="EXPENSE"
          title="Expense Distribution"
          currency="EUR"
          bare
        />,
      ),
    );
    expect(container.querySelector("foreignObject")).not.toBeNull();
    expect(screen.getByTestId("number-flow")).toHaveTextContent("1234 €");
    expect(screen.getByText("spent")).toBeInTheDocument();
  });

  it("TransactionPieChart v2 shows the empty placeholder without income", () => {
    setUiVersion("v2");
    render(
      withTheme(
        <TransactionPieChart
          transactions={[]}
          type="INCOME"
          title="Income Distribution"
          currency="EUR"
        />,
      ),
    );
    expect(
      screen.getByText("No income distribution data available."),
    ).toBeInTheDocument();
  });
});

describe("Categories investments", () => {
  afterEach(() => {
    investTags.clear();
    localStorage.clear();
    setUiVersion("v1");
  });

  const pie = (
    transactions: Transaction[],
    type: "EXPENSE" | "INCOME" = "EXPENSE",
  ) =>
    withTheme(
      <TransactionPieChart
        transactions={transactions}
        type={type}
        title="Expense Distribution"
        currency="EUR"
        bare
        investmentTags={new Set(["PAC"])}
      />,
    );

  const expenses = [tx("Food", 40), tx("PAC", 300)];

  it("pie excludes investment slices by default", () => {
    setUiVersion("v2");
    render(pie(expenses));
    expect(screen.getByTestId("number-flow")).toHaveTextContent("40 €");
    expect(screen.queryByText("PAC")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Investments/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("the chip includes investment slices and updates the centre total", () => {
    setUiVersion("v2");
    render(pie(expenses));
    fireEvent.click(screen.getByRole("button", { name: /Investments/ }));
    expect(screen.getByRole("button", { name: /Investments/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("number-flow")).toHaveTextContent("340 €");
    expect(screen.getAllByText("PAC").length).toBeGreaterThan(0);
    expect(screen.getByText("spent")).toBeInTheDocument();
  });

  it("persists the chip state per device and flow type", () => {
    setUiVersion("v2");
    const { unmount } = render(pie(expenses));
    fireEvent.click(screen.getByRole("button", { name: /Investments/ }));
    expect(localStorage.getItem("categories.showInvestments.EXPENSE")).toBe(
      "true",
    );
    expect(
      localStorage.getItem("categories.showInvestments.INCOME"),
    ).toBeNull();
    unmount();
    render(pie(expenses));
    expect(screen.getByRole("button", { name: /Investments/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("the Income pie reads its own stored state", () => {
    setUiVersion("v2");
    localStorage.setItem("categories.showInvestments.EXPENSE", "true");
    render(
      pie(
        [
          { ...tx("Salary", 10), type: "INCOME" },
          { ...tx("PAC", 5), type: "INCOME" },
        ],
        "INCOME",
      ),
    );
    expect(screen.getByRole("button", { name: /Investments/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("number-flow")).toHaveTextContent("10 €");
  });

  it("investment slices are drawn in the violet token, whatever their own colour", () => {
    setUiVersion("v2");
    localStorage.setItem("categories.showInvestments.EXPENSE", "true");
    const sub = {
      ...tx("ETF", 300),
      tag: {
        name: "ETF",
        icon: "piggyBank",
        colorHex: "#22c55e",
        parentName: "Invest",
      },
    } as unknown as Transaction;
    const { container } = render(
      withTheme(
        <TransactionPieChart
          transactions={[tx("Food", 40), sub]}
          type="EXPENSE"
          title="Expense Distribution"
          currency="EUR"
          bare
          investmentTags={new Set(["Invest", "ETF"])}
        />,
      ),
    );
    const fills = Array.from(container.querySelectorAll(".MuiPieArc-root")).map(
      (arc) => arc.getAttribute("fill"),
    );
    // Inner ring: the flagged parent is violet, Food keeps its colour.
    // Outer ring: the investment child is a 60% violet tint, Food keeps its colour.
    expect(fills).toContain("var(--color-app-invest)");
    expect(fills).toContain(
      "color-mix(in srgb, var(--color-app-invest) 60%, transparent)",
    );
    expect(fills.filter((f) => f === "#22c55e").length).toBe(2); // Food, inner + outer
  });

  it("no chip when the wallet has no investment tags", () => {
    setUiVersion("v2");
    render(
      withTheme(
        <TransactionPieChart
          transactions={expenses}
          type="EXPENSE"
          title="Expense Distribution"
          currency="EUR"
          bare
          investmentTags={new Set()}
        />,
      ),
    );
    expect(
      screen.queryByRole("button", { name: /Investments/ }),
    ).not.toBeInTheDocument();
  });

  it("the landing pie without investment tags shows no chip", () => {
    setUiVersion("v2");
    render(
      withTheme(
        <TransactionPieChart
          transactions={expenses}
          type="EXPENSE"
          title="Distribution"
          bare
        />,
      ),
    );
    expect(
      screen.queryByRole("button", { name: /Investments/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("number-flow")).toHaveTextContent("340 €");
  });

  it("CategoryRanking leaves investment tags out", () => {
    setUiVersion("v2");
    investTags.add("PAC");
    render(
      <CategoryRanking
        transactions={[tx("Food", 75), tx("PAC", 25)]}
        type="EXPENSE"
        title="Top Expense Categories"
        currency="€"
      />,
    );
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.queryByText("PAC")).not.toBeInTheDocument();
  });
});

describe("CategoryRanking v2 animation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setUiVersion("v1");
  });

  it("grows each bar from 0 on the next frame and counts up from 0", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    setUiVersion("v2");
    const { container } = render(
      <CategoryRanking
        transactions={[tx("Food", 75), tx("Rent", 25)]}
        type="EXPENSE"
        title="Top Expense Categories"
        currency="€"
      />,
    );
    const fills = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(".bg-app-raised.h-1\\.5 > div"),
      );
    expect(fills().map((f) => f.style.width)).toEqual(["0%", "0%"]);
    expect(screen.getAllByTestId("number-flow")[0]).toHaveTextContent("0,00");
    act(() => frames.forEach((cb) => cb(0)));
    // The second row waits its 40ms stagger.
    expect(fills().map((f) => f.style.width)).toEqual(["75%", "0%"]);
    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(fills().map((f) => f.style.width)).toEqual(["75%", "25%"]);
    vi.useRealTimers();
  });
});
