import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Transaction } from "../../../types/domain.ts";
import { formatAmount } from "../../../utils/format.ts";

vi.mock("../../../components/ui/SwitchableCard.tsx", () => ({
  SwitchableCard: (props: {
    tabs: { key: string; label: string }[];
    onTabChange?: (key: string) => void;
    centerElement?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <div>
      {props.tabs.map((t) => (
        <button key={t.key} onClick={() => props.onTabChange?.(t.key)}>
          {t.label}
        </button>
      ))}
      {props.centerElement}
      {props.children}
    </div>
  ),
}));

import { OverviewTableV2 } from "../../../dashboard/statistics/OverviewTableV2.tsx";

beforeAll(() => {
  Element.prototype.scrollTo =
    vi.fn() as unknown as typeof Element.prototype.scrollTo;
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

const transactions: Transaction[] = [
  tx({ transactionDate: "2024-01-15T12:00:00", type: "INCOME", amount: 1000 }),
  tx({ transactionDate: "2024-01-16T12:00:00", type: "EXPENSE", amount: 100 }),
  tx({ transactionDate: "2024-02-10T12:00:00", type: "INCOME", amount: 200 }),
  tx({ transactionDate: "2024-02-11T12:00:00", type: "EXPENSE", amount: 350 }),
];

const rowFor = (name: string) =>
  screen.getByRole("rowheader", { name }).parentElement!;

describe("OverviewTableV2", () => {
  it("renders one row per month with income in green and the totals row", () => {
    render(<OverviewTableV2 transactions={transactions} />);

    const jan = within(rowFor("Jan"));
    const income = jan.getByText(`+${formatAmount(1000)}`);
    expect(income).toHaveClass("text-app-income");
    expect(jan.getByText(`-${formatAmount(100)}`)).not.toHaveClass(
      "text-app-income",
    );
    expect(jan.getByText(`+${formatAmount(900)}`)).toBeInTheDocument();

    const total = within(rowFor("Total"));
    expect(total.getByText(`+${formatAmount(1200)}`)).toBeInTheDocument();
    expect(total.getByText(`-${formatAmount(450)}`)).toBeInTheDocument();
  });

  it("shows a dash for months without data", () => {
    render(<OverviewTableV2 transactions={transactions} />);
    expect(within(rowFor("Mar")).getAllByText("—")).toHaveLength(3);
  });

  it("switches to the yearly view and labels the year column", async () => {
    render(<OverviewTableV2 transactions={transactions} />);
    await userEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(
      screen.getByRole("columnheader", { name: "Year" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "2024" })).toBeInTheDocument();
  });

  it("moves the selected year with the year buttons", async () => {
    const older: Transaction[] = [
      ...transactions,
      tx({
        transactionDate: "2023-05-05T12:00:00",
        type: "INCOME",
        amount: 40,
      }),
    ];
    render(<OverviewTableV2 transactions={older} />);
    expect(screen.getByText("2024")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Previous year" }),
    );
    expect(screen.getByText("2023")).toBeInTheDocument();
  });
});
