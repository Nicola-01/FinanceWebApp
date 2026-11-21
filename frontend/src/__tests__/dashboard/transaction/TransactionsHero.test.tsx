import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Transaction } from "../../../types/domain";

const ctx = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
const trendSpy = vi.hoisted(() => vi.fn());

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({
  useWalletContext: () => ctx.value,
}));

// The chart kit cannot lay out in jsdom; record the rows the trend receives.
vi.mock("../../../components/ui/LazyHeroTrend.tsx", () => ({
  LazyHeroTrend: (props: unknown) => {
    trendSpy(props);
    return <div data-testid="trend" />;
  },
}));

import { TransactionsHero } from "../../../dashboard/transaction/TransactionsHero";

const tx = (
  id: string,
  type: "INCOME" | "EXPENSE",
  amount: number,
  extra: Partial<Transaction> = {},
) =>
  ({
    id,
    name: `Tx ${id}`,
    type,
    amount,
    needsReview: false,
    amountPending: false,
    tag: { name: "Food" },
    transactionDate: "2026-03-10",
    ...extra,
  }) as unknown as Transaction;

const setup = (
  transactions: Transaction[],
  datePreset: string,
  tags: unknown[] = [{ name: "Food" }, { name: "PAC", investment: true }],
) => {
  ctx.value = {
    wallet: { color: "#8b5cf6", currency: "EUR" },
    transactions,
    tags,
    dateRange: {
      start: new Date(2026, 2, 1),
      end: new Date(2026, 2, 31),
    },
    datePreset,
  };
  render(<TransactionsHero />);
};

const march = [
  tx("1", "INCOME", 1000),
  tx("2", "EXPENSE", 250.5),
  tx("3", "EXPENSE", 149.5),
  tx("4", "INCOME", 100, { transactionDate: "2026-02-01" }),
  tx("5", "EXPENSE", 999, { amountPending: true }),
];

describe("TransactionsHero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders net, income and spent totals for the period, ignoring pending rows", () => {
    setup(march, "month");
    // Net = 1000 - 400 = +600 (the pending expense and the out-of-period row are ignored).
    expect(screen.getByText("+600,00 €")).toBeInTheDocument();
    expect(screen.getByText("Net in March 2026")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("+1000,00 €")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.getByText("400,00 €")).toBeInTheDocument();
    expect(screen.getByText("1 transaction")).toBeInTheDocument();
  });

  it("shows the spent share of income when there is income", () => {
    setup(march, "month");
    expect(screen.getByText("40% of income")).toBeInTheDocument();
  });

  it("has no period switcher; the toolbar date picker owns the period", () => {
    setup(march, "month");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("uses the generic label for the all preset", () => {
    setup(march, "all");
    expect(screen.getByText("Net in this period")).toBeInTheDocument();
  });

  it("shows 'Nothing yet' when there are neither incomes nor expenses", () => {
    setup([], "all");
    expect(screen.getAllByText("Nothing yet")).toHaveLength(2);
    expect(screen.queryByText(/% of income/)).toBeNull();
  });

  it("shows the expense count when there is no income", () => {
    setup([tx("1", "EXPENSE", 20)], "all");
    expect(screen.getByText("1 transaction")).toBeInTheDocument();
    expect(screen.queryByText(/% of income/)).toBeNull();
  });

  it("draws the daily trend when the period has movement", () => {
    setup(march, "month");
    expect(screen.getByTestId("trend")).toBeInTheDocument();
    const { rows, color } = trendSpy.mock.calls[0][0];
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((r: { v: number }) => r.v !== 0)).toBe(true);
    expect(color).toMatch(/^#/);
  });

  it("hides the trend when the period is empty", () => {
    setup([], "all");
    expect(screen.queryByTestId("trend")).toBeNull();
  });

  it("shares one fitted value size across the four tiles", () => {
    setup(march, "march");
    const grid = screen
      .getByText("Income")
      .closest(".gap-3\\.5") as HTMLElement;
    expect(grid.style.getPropertyValue("--stat-value-size")).toBe("22px");
  });

  it("formats Liquidity left with the same it-IT money format as the other tiles", () => {
    setup([tx("1", "INCOME", 16250)], "month");
    // Net and Income both read +16.250,00 €; Liquidity left is the unsigned one.
    expect(screen.getAllByText("+16.250,00 €")).toHaveLength(2);
    expect(screen.getByText("16.250,00 €")).toBeInTheDocument();
  });

  it("renders four tiles: Income, Spent, Invested and Liquidity left", () => {
    setup(
      [
        tx("1", "INCOME", 2400),
        tx("2", "EXPENSE", 1380),
        tx("3", "EXPENSE", 500, { tag: { name: "PAC" } as Transaction["tag"] }),
        tx("4", "INCOME", 200, { tag: { name: "PAC" } as Transaction["tag"] }),
      ],
      "month",
    );
    // Net = Income - Spent = 1020; Invested net = 500 bought - 200 cashed out = 300.
    expect(screen.getByText("+1020,00 €")).toBeInTheDocument();
    expect(screen.getByText("+2400,00 €")).toBeInTheDocument();
    expect(screen.getByText("1380,00 €")).toBeInTheDocument();
    expect(screen.getByText("57% of income")).toBeInTheDocument();
    expect(screen.getByText("Invested")).toBeInTheDocument();
    expect(screen.getByText("300,00 €")).toBeInTheDocument();
    expect(screen.getByText("500,00 in · 200,00 out")).toBeInTheDocument();
    expect(screen.getByText("Liquidity left")).toBeInTheDocument();
    expect(screen.getByText("720,00 €")).toBeInTheDocument();
    expect(screen.getByText("Net − Invested")).toBeInTheDocument();
  });

  it("keeps investment flows out of the trend", () => {
    setup(
      [tx("1", "EXPENSE", 500, { tag: { name: "PAC" } as Transaction["tag"] })],
      "month",
    );
    expect(screen.queryByTestId("trend")).toBeNull();
  });
});

describe("TransactionsHero without a flagged investment tag", () => {
  it("shows only Income and Spent tiles", () => {
    setup(march, "month", [{ name: "Food" }]);
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.queryByText("Invested")).toBeNull();
    expect(screen.queryByText("Liquidity left")).toBeNull();
  });

  it("shows the Invested and Liquidity tiles once a tag is flagged", () => {
    setup(march, "month");
    expect(screen.getByText("Invested")).toBeInTheDocument();
    expect(screen.getByText("Liquidity left")).toBeInTheDocument();
  });

  it("stacks Income and Spent in one desktop column when no tag is flagged", () => {
    setup(march, "month", [{ name: "Food" }]);
    const tiles = screen
      .getByText("Income")
      .closest(".gap-3\\.5") as HTMLElement;
    expect(tiles.className).toContain("lg:grid-cols-1");
    expect(tiles.parentElement!.className).toContain("lg:grid-cols-[2fr_1fr]");
  });

  it("keeps the two-column tile grid when an investment tag is flagged", () => {
    setup(march, "month");
    const tiles = screen
      .getByText("Income")
      .closest(".gap-3\\.5") as HTMLElement;
    expect(tiles.className).not.toContain("lg:grid-cols-1");
    expect(tiles.parentElement!.className).toContain(
      "lg:grid-cols-[1.5fr_1fr]",
    );
  });
});
