import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import type { Transaction } from "../../../types/domain.ts";
import { StatisticsSummaryV2 } from "../../../dashboard/statistics/StatisticsSummaryV2.tsx";
import { setUiVersion } from "../../../utils/uiVersion.ts";

vi.mock("@number-flow/react", () => import("../../../test/numberFlowStub"));

// Record what each sparkline receives; render nothing so the tests stay on props.
const { calls, record } = vi.hoisted(() => {
  const calls: Record<string, Record<string, unknown>[]> = {};
  const record = (name: string, props: Record<string, unknown>) => {
    (calls[name] ??= []).push(props);
    return null;
  };
  return { calls, record };
});

// The investment tag set comes from WalletContext; tests set it per case.
const { investTags } = vi.hoisted(() => ({
  investTags: { current: new Set<string>() },
}));
vi.mock("../../../dashboard/wallet/useInvestmentTags.ts", () => ({
  useInvestmentTags: () => investTags.current,
}));

vi.mock("@/components/ui/charts", () => ({
  AreaSparkline: (p: Record<string, unknown>) => record("AreaSparkline", p),
  LineSparkline: (p: Record<string, unknown>) => record("LineSparkline", p),
}));

vi.mock("../../../dashboard/statistics/useChartPalette.ts", () => ({
  useChartPalette: () => ({
    isV2: true,
    income: "#c-income",
    expense: "#c-expense",
    balance: "#c-balance",
    warn: "#c-warn",
    danger: "#c-danger",
    subscription: "#c-sub",
    neutral: "#c-neutral",
    grid: "",
    axis: "",
  }),
}));

const tag = { name: "General", icon: "tag", colorHex: "#fff" };
const tx = (date: string, type: "INCOME" | "EXPENSE", amount: number) =>
  ({
    id: `${date}-${type}-${amount}`,
    name: "tx",
    tag,
    amount,
    transactionDate: `${date}T12:00:00`,
    type,
  }) as Transaction;

// Previous year (2025): earned 2500, spent 1000, kept 1500, savings 60%.
// 2026 (to June 15): earned 3000, spent 2000, kept 1000, savings 33%.
// Spent vs 2025: +100%.
const transactions: Transaction[] = [
  tx("2025-01-10", "INCOME", 2500),
  tx("2025-03-10", "EXPENSE", 1000),
  tx("2026-01-10", "INCOME", 1500),
  tx("2026-02-10", "INCOME", 1500),
  tx("2026-02-12", "EXPENSE", 1500),
  tx("2026-04-10", "EXPENSE", 500),
];

const today = new Date(2026, 5, 15);
const year2026 = { kind: "year", year: 2026 } as const;

// AnimatedNumber with `intro` renders 0 and switches to the value one animation frame later.
// Render, then flush that frame so the sub-line text is the settled value.
const renderSettled = async (ui: React.ReactElement) => {
  const result = render(ui);
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  return result;
};

describe("StatisticsSummaryV2", () => {
  beforeEach(() => {
    for (const k of Object.keys(calls)) delete calls[k];
    investTags.current = new Set();
    setUiVersion("v2");
  });

  afterEach(() => {
    setUiVersion("v1");
  });

  // The sub-line of a tile: the text node after its label/value (the sparkline footer is not text).
  const subOf = (label: string) =>
    screen.getByText(label).parentElement!.querySelector(".text-app-faint");
  const subText = (label: string) => subOf(label)?.textContent ?? null;

  it("renders the four tiles with period labels and per-month averages", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("Earned in 2026")).toBeInTheDocument();
    expect(screen.getByText("Spent in 2026")).toBeInTheDocument();
    expect(screen.getByText("Kept")).toBeInTheDocument();
    expect(screen.getByText("Savings rate")).toBeInTheDocument();
    expect(await screen.findByLabelText("+3000,00 €")).toBeInTheDocument();
    expect(await screen.findByLabelText("2000,00 €")).toBeInTheDocument();
    expect(await screen.findByLabelText("+1000,00 €")).toBeInTheDocument();
    expect(await screen.findByLabelText("33%")).toBeInTheDocument();
  });

  it("shows the per-month average and the previous-year change in the earned and spent sub-lines", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    // 3000 over 6 elapsed months; earned +20% vs 2500.
    expect(subText("Earned in 2026")).toBe(
      "about 500 € a month · +20% vs 2025",
    );
    // 2000 over 6 months; spent +100% vs 1000.
    expect(subText("Spent in 2026")).toBe(
      "about 333 € a month · +100% vs 2025",
    );
  });

  it("colours the earned change green when earnings rose and red when they fell", async () => {
    const { unmount } = await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("+20%").parentElement).toHaveClass(
      "text-app-income",
    );
    unmount();

    const lower = [
      tx("2025-01-10", "INCOME", 1000),
      tx("2026-02-10", "INCOME", 500),
    ];
    await renderSettled(
      <StatisticsSummaryV2
        transactions={lower}
        period={year2026}
        today={today}
      />,
    );
    // Earned -50% (kept also moves -50%, so scope the lookup to the earned tile).
    expect(subText("Earned in 2026")).toBe("about 83 € a month · −50% vs 2025");
    expect(
      within(subOf("Earned in 2026")!).getByText("−50%").parentElement,
    ).toHaveClass("text-app-danger");
  });

  it("colours the spent change red when spending rose vs the previous year", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("+100%").parentElement).toHaveClass(
      "text-app-danger",
    );
  });

  it("colours the spent change green with a minus sign when spending fell", async () => {
    const lower = [
      tx("2025-01-10", "EXPENSE", 1000),
      tx("2026-02-12", "EXPENSE", 500),
    ];
    await renderSettled(
      <StatisticsSummaryV2
        transactions={lower}
        period={year2026}
        today={today}
      />,
    );
    const pct = screen.getByText("−50%");
    expect(pct.parentElement).toHaveClass("text-app-income");
  });

  it("shows the previous-year kept with its change and the previous savings rate with its change", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    // Kept 1000 vs 1500: -33%. Rate 33% vs 60%: -44% of 60.
    expect(subText("Kept")).toBe("+1500 € (−33%) vs 2025");
    expect(screen.getByText("+1500 €").parentElement).toHaveClass(
      "text-app-income",
    );
    expect(screen.getByText("−33%").parentElement).toHaveClass(
      "text-app-danger",
    );
    expect(subText("Savings rate")).toBe("60% (−44%) vs 2025");
  });

  it("colours a negative previous-year kept red and a rise from it green", async () => {
    const losing = [
      tx("2025-01-10", "INCOME", 500),
      tx("2025-03-10", "EXPENSE", 1000),
      tx("2026-01-10", "INCOME", 1000),
    ];
    await renderSettled(
      <StatisticsSummaryV2
        transactions={losing}
        period={year2026}
        today={today}
      />,
    );
    // Kept -500 -> 1000 is +300% of |-500|.
    expect(subText("Kept")).toBe("−500 € (+300%) vs 2025");
    expect(screen.getByText("−500 €").parentElement).toHaveClass(
      "text-app-danger",
    );
    expect(screen.getByText("+300%").parentElement).toHaveClass(
      "text-app-income",
    );
  });

  it("omits the earned and spent changes when the previous year has nothing to compare", async () => {
    // 2025 spent 1000 and earned nothing: no earned change; spent -50%.
    const noPrevEarned = [
      tx("2025-03-10", "EXPENSE", 1000),
      tx("2026-01-10", "INCOME", 1500),
      tx("2026-02-12", "EXPENSE", 500),
    ];
    await renderSettled(
      <StatisticsSummaryV2
        transactions={noPrevEarned}
        period={year2026}
        today={today}
      />,
    );
    expect(subText("Earned in 2026")).toBe("about 250 € a month");
    expect(subText("Spent in 2026")).toBe("about 83 € a month · −50% vs 2025");
    // Kept -1000 -> 1000 is +200% of |-1000|.
    expect(subText("Kept")).toBe("−1000 € (+200%) vs 2025");
  });

  it("omits the parenthesised change when the previous kept or savings rate is zero", async () => {
    const breakEven = [
      tx("2025-01-10", "INCOME", 100),
      tx("2025-03-10", "EXPENSE", 100),
      tx("2026-01-10", "INCOME", 300),
    ];
    await renderSettled(
      <StatisticsSummaryV2
        transactions={breakEven}
        period={year2026}
        today={today}
      />,
    );
    expect(subText("Kept")).toBe("0 € vs 2025");
    expect(subText("Savings rate")).toBe("0% vs 2025");
  });

  it("omits the previous-year kept and savings rate sub-lines when there is no previous year", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={[tx("2026-01-10", "INCOME", 300)]}
        period={year2026}
        today={today}
      />,
    );
    expect(subOf("Kept")).toBeNull();
    expect(subOf("Savings rate")).toBeNull();
    expect(subText("Earned in 2026")).toBe("about 50 € a month");
  });

  it("omits the per-month average when no months have elapsed, keeping the change", async () => {
    // 2027 has no elapsed months; every 2026 comparison is 100% down.
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={{ kind: "year", year: 2027 }}
        today={today}
      />,
    );
    expect(subText("Earned in 2027")).toBe("−100% vs 2026");
    expect(subText("Spent in 2027")).toBe("−100% vs 2026");
    expect(subOf("Savings rate")).toBeNull();
  });

  it("shows an em dash for the savings rate when nothing was earned", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={[tx("2026-02-12", "EXPENSE", 500)]}
        period={year2026}
        today={today}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("uses plain labels for all time and drops the previous-year lines", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={{ kind: "all" }}
        today={today}
        currencySymbol="$"
      />,
    );
    expect(screen.getByText("Earned")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.queryByText(/in 2026/)).toBeNull();
    expect(screen.queryByText(/All time/)).toBeNull();
    // 5500 earned over 18 months (Jan 2025 to Jun 2026).
    expect(subText("Earned")).toBe("about 306 $ a month");
    expect(screen.queryByText(/vs 2025/)).toBeNull();
    expect(subOf("Kept")).toBeNull();
  });

  it("feeds the sparklines the per-month series with the chart colours", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={today}
      />,
    );
    const [earned, spent] = calls.AreaSparkline;
    expect(earned.data).toEqual([
      { v: 1500 },
      { v: 1500 },
      { v: 0 },
      { v: 0 },
      { v: 0 },
      { v: 0 },
    ]);
    expect(earned).toMatchObject({
      dataKey: "v",
      color: "#c-income",
      fill: "gradient",
      height: 36,
      curve: "monotone",
      interactive: false,
      ariaLabel: "Earned per month",
    });

    const kept = calls.LineSparkline.find((p) => p.color === "#c-balance")!;
    expect(kept.data).toEqual([
      { v: 1500 },
      { v: 0 },
      { v: 0 },
      { v: -500 },
      { v: 0 },
      { v: 0 },
    ]);

    const rate = calls.LineSparkline.find((p) => p.color === "#c-warn")!;
    const rates = (rate.data as { v: number }[]).map((r) => Math.round(r.v));
    expect(rates).toEqual([100, 0]);
    expect(spent.data).toEqual([
      { v: 0 },
      { v: 1500 },
      { v: 0 },
      { v: 500 },
      { v: 0 },
      { v: 0 },
    ]);
    expect(spent).toMatchObject({ color: "#c-expense", dataKey: "v" });
  });

  it("skips a sparkline whose points are all zero", async () => {
    // Only spending in 2026: the earned series is all zeros, so no earned sparkline.
    await renderSettled(
      <StatisticsSummaryV2
        transactions={[tx("2026-02-12", "EXPENSE", 500)]}
        period={year2026}
        today={today}
      />,
    );
    expect(calls.AreaSparkline.map((p) => p.ariaLabel)).toEqual([
      "Spent per month",
    ]);
  });

  it("skips a sparkline with fewer than two points", async () => {
    await renderSettled(
      <StatisticsSummaryV2
        transactions={transactions}
        period={year2026}
        today={new Date(2026, 0, 20)}
      />,
    );
    expect(calls.AreaSparkline ?? []).toHaveLength(0);
    expect(calls.LineSparkline ?? []).toHaveLength(0);
  });

  describe("with investment tags", () => {
    const stocks = { name: "Stocks", icon: "tag", colorHex: "#fff" };
    const investing = [
      ...transactions,
      { ...tx("2026-03-10", "EXPENSE", 500), tag: stocks },
      { ...tx("2026-03-11", "INCOME", 200), tag: stocks },
    ];

    it("renders five tiles in order, with Invested between Spent and Kept", async () => {
      investTags.current = new Set(["Stocks"]);
      await renderSettled(
        <StatisticsSummaryV2
          transactions={investing}
          period={year2026}
          today={today}
        />,
      );
      const order = screen
        .getAllByText(/^(Earned|Spent|Invested|Kept|Savings rate)( in 2026)?$/)
        .map((el) => el.textContent);
      expect(order).toEqual([
        "Earned in 2026",
        "Spent in 2026",
        "Invested in 2026",
        "Kept",
        "Savings rate",
      ]);
    });

    it("shows invested net with bought and cashed out in its sub-line, and keeps earned and spent free of investments", async () => {
      investTags.current = new Set(["Stocks"]);
      await renderSettled(
        <StatisticsSummaryV2
          transactions={investing}
          period={year2026}
          today={today}
        />,
      );
      expect(await screen.findByLabelText("+300,00 €")).toBeInTheDocument();
      expect(subText("Invested in 2026")).toBe("500 € in · 200 € out");
      // Spent stays at 2000 (the 500 bought is not spending) and earned at 3000.
      expect(subText("Spent in 2026")).toBe(
        "about 333 € a month · +100% vs 2025",
      );
      expect(subText("Earned in 2026")).toBe(
        "about 500 € a month · +20% vs 2025",
      );
    });

    it("spans the savings rate tile across two phone columns only", async () => {
      await renderSettled(
        <StatisticsSummaryV2
          transactions={transactions}
          period={year2026}
          today={today}
        />,
      );
      const rate = screen.getByText("Savings rate").closest(".col-span-2");
      expect(rate).not.toBeNull();
      expect(rate).toHaveClass("lg:col-span-1");
      expect(
        screen.getByText("Invested in 2026").closest(".col-span-2"),
      ).toBeNull();
    });
  });
});
