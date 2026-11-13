import { describe, it, expect, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { setUiVersion } from "../../../utils/uiVersion";
import { ChartCard } from "../../../dashboard/tag/ChartCard";
import { FlowTypeToggle } from "../../../dashboard/tag/FlowTypeToggle";
import { CategoryRanking } from "../../../dashboard/tag/CategoryRanking";
import { TransactionPieChart } from "../../../dashboard/tag/TransactionPieChart";
import type { Transaction } from "../../../types/domain";
import { ThemeContext } from "../../../utils/ThemeContext";

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

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
    expect(screen.getByRole("button", { name: "Income" })).toHaveClass(
      "text-app-income",
    );
  });

  it("FlowTypeToggle keeps the inactive Income label in the income hue", () => {
    setUiVersion("v2");
    render(<FlowTypeToggle value="EXPENSE" onChange={vi.fn()} />);
    const income = screen.getByRole("button", { name: "Income" });
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
