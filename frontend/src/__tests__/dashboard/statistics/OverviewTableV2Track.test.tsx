import { describe, it, expect, afterEach, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";
import { OverviewTableV2 } from "../../../dashboard/statistics/OverviewTableV2.tsx";
import { setUiVersion } from "../../../utils/uiVersion.ts";

vi.mock("../../../components/ui/SwitchableCard.tsx", () => ({
  SwitchableCard: (props: {
    centerElement?: React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <div>
      {props.centerElement}
      {props.children}
    </div>
  ),
}));

const now = new Date();
const thisYear = now.getFullYear();
const thisMonthName = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
][now.getMonth()];

const tx = (date: string, type: "INCOME" | "EXPENSE", amount: number) =>
  ({
    id: `${date}-${type}`,
    name: "tx",
    tag: { name: "General", icon: "tag", colorHex: "#fff" },
    amount,
    transactionDate: `${date}T12:00:00`,
    type,
  }) as Transaction;

const transactions = [
  tx(`${thisYear}-01-10`, "INCOME", 1000),
  tx(`${thisYear}-02-10`, "EXPENSE", 250),
];

afterEach(() => setUiVersion("v1"));

const rowFor = (name: string) =>
  screen.getByRole("rowheader", { name }).parentElement!;

describe("OverviewTableV2 net track and current month", () => {
  it("sizes each month's track by |net| relative to the busiest month", () => {
    setUiVersion("v2");
    render(<OverviewTableV2 transactions={transactions} />);
    const fill = (name: string) =>
      rowFor(name).querySelector<HTMLElement>("div.h-full")!.style.width;
    expect(fill("Jan")).toBe("100%");
    expect(fill("Feb")).toBe("25%");
    expect(fill("Mar")).toBe("0%");
  });

  it("highlights the current month row", () => {
    setUiVersion("v2");
    render(<OverviewTableV2 transactions={transactions} />);
    expect(rowFor(thisMonthName).className).toContain("bg-app-raised");
    const other = thisMonthName === "Jan" ? "Feb" : "Jan";
    expect(rowFor(other).className).not.toContain("bg-app-raised");
  });
});
