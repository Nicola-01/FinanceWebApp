import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Transaction } from "../../../utils/types.ts";

// Replace the heavy SwitchableCard shell (framer-motion, react-use, MUI-ish
// Selector, WalletContext) with a light stub so we can drive OverviewTable's
// own data-shaping (rows / cells / totals / tab + year switching) in isolation.
vi.mock("../../../dashboard/statistics/SwitchableCard.tsx", () => ({
  SwitchableCard: (props: {
    tabs: { key: string; label: string; title: string }[];
    activeTab?: string;
    onTabChange?: (key: string) => void;
    title?: string;
    centerElement?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="card-title">{props.title}</div>
      <div data-testid="tabs">
        {props.tabs.map((t) => (
          <button
            key={t.key}
            data-active={props.activeTab === t.key}
            onClick={() => props.onTabChange?.(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {props.centerElement ? (
        <div data-testid="center">{props.centerElement}</div>
      ) : null}
      {props.children}
    </div>
  ),
}));

import { OverviewTable } from "../../../dashboard/statistics/OverviewTable.tsx";

// jsdom does not implement Element.scrollTo; the auto-scroll effect calls it.
beforeAll(() => {
  Element.prototype.scrollTo =
    vi.fn() as unknown as typeof Element.prototype.scrollTo;
});

const fmt = (v: number): string =>
  v.toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const tag = { name: "General", icon: "tag", colorHex: "#fff" };

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  name: "tx",
  tag,
  amount: 0,
  transactionDate: "2024-01-01T12:00:00",
  type: "EXPENSE",
  ...over,
});

// Year 2024: Jan income 1000 / expense 100, Feb income 200 / expense 350.
// Totals: income 1200, expense 450, balance 750. All resulting cell strings
// (with signs) are distinct, so getByText can target each unambiguously.
const transactions2024: Transaction[] = [
  tx({ transactionDate: "2024-01-15T12:00:00", type: "INCOME", amount: 1000 }),
  tx({ transactionDate: "2024-01-16T12:00:00", type: "EXPENSE", amount: 100 }),
  tx({ transactionDate: "2024-02-10T12:00:00", type: "INCOME", amount: 200 }),
  tx({ transactionDate: "2024-02-11T12:00:00", type: "EXPENSE", amount: 350 }),
];

describe("OverviewTable", () => {
  it("renders the monthly overview with correct per-month cells and totals", () => {
    render(<OverviewTable transactions={transactions2024} />);

    // Starts on the Monthly view.
    expect(screen.getByTestId("card-title")).toHaveTextContent(
      "Monthly Overview",
    );
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();

    // January cells (income / expense / balance).
    expect(screen.getByText(`+${fmt(1000)}`)).toBeInTheDocument();
    expect(screen.getByText(`-${fmt(100)}`)).toBeInTheDocument();
    expect(screen.getByText(`+${fmt(900)}`)).toBeInTheDocument();

    // February cells.
    expect(screen.getByText(`+${fmt(200)}`)).toBeInTheDocument();
    expect(screen.getByText(`-${fmt(350)}`)).toBeInTheDocument();
    expect(screen.getByText(`-${fmt(150)}`)).toBeInTheDocument();

    // Totals column.
    expect(screen.getByText(`+${fmt(1200)}`)).toBeInTheDocument();
    expect(screen.getByText(`-${fmt(450)}`)).toBeInTheDocument();
    expect(screen.getByText(`+${fmt(750)}`)).toBeInTheDocument();
  });

  it("switches to the yearly view when the Yearly tab is selected", async () => {
    const user = userEvent.setup();
    render(<OverviewTable transactions={transactions2024} />);

    await user.click(screen.getByRole("button", { name: "Yearly" }));

    expect(screen.getByTestId("card-title")).toHaveTextContent(
      "Yearly Overview",
    );
    // The single year column header appears.
    expect(screen.getByText("2024")).toBeInTheDocument();
    // Yearly totals equal the single year's aggregates.
    expect(screen.getAllByText(`+${fmt(1200)}`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`-${fmt(450)}`).length).toBeGreaterThan(0);
  });

  it("navigates between years via the center selector in monthly mode", async () => {
    const user = userEvent.setup();
    const multiYear: Transaction[] = [
      tx({
        transactionDate: "2024-05-10T12:00:00",
        type: "INCOME",
        amount: 500,
      }),
      tx({
        transactionDate: "2023-05-10T12:00:00",
        type: "INCOME",
        amount: 700,
      }),
    ];
    render(<OverviewTable transactions={multiYear} />);

    const center = screen.getByTestId("center");
    // Defaults to the most recent year.
    expect(center).toHaveTextContent("2024");

    // First button in the selector is the "previous year" chevron.
    const [backButton] = within(center).getAllByRole("button");
    await user.click(backButton);

    expect(screen.getByTestId("center")).toHaveTextContent("2023");
  });

  it("falls back to the current year when there are no transactions", () => {
    render(<OverviewTable transactions={[]} />);
    const currentYear = String(new Date().getFullYear());
    expect(screen.getByTestId("center")).toHaveTextContent(currentYear);
  });
});
