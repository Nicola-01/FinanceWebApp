import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Transaction, Wallet } from "../../../types/domain";
import { TransactionView } from "../../../modals/transaction/TransactionView";
import { setUiVersion } from "../../../utils/uiVersion";

vi.mock("../../../components/ui/TagBadge.tsx", () => ({
  TagBadge: () => <div data-testid="tag-badge" />,
}));
vi.mock("../../../modals/common/exchangeRate/ExchangeRateSection", () => ({
  ExchangeRateSection: () => <div data-testid="exchange" />,
}));

const wallet = { currency: "EUR" } as unknown as Wallet;

const makeTx = (over: Partial<Transaction>): Transaction =>
  ({
    id: "t1",
    name: "Groceries",
    type: "EXPENSE",
    amount: 42.5,
    transactionDate: "2026-11-21",
    notes: "",
    ...over,
  }) as unknown as Transaction;

describe("TransactionView (v2)", () => {
  beforeEach(() => setUiVersion("v2"));
  afterEach(() => setUiVersion("v1"));

  it("shows the amount as a neutral hero for expenses", () => {
    render(<TransactionView tx={makeTx({})} wallet={wallet} />);
    const amount = screen.getByText("-42.50", { exact: false });
    expect(amount).toHaveClass("text-5xl", "tabular-nums", "text-app-text");
    expect(amount).not.toHaveClass("text-app-red");
  });

  it("colours income green and shows the pending placeholder", () => {
    const { rerender } = render(
      <TransactionView
        tx={makeTx({ type: "INCOME", amount: 10 })}
        wallet={wallet}
      />,
    );
    expect(screen.getByText("+10.00", { exact: false })).toHaveClass(
      "text-app-income",
    );
    rerender(
      <TransactionView tx={makeTx({ amountPending: true })} wallet={wallet} />,
    );
    expect(screen.getByText("Amount pending")).toHaveClass("text-2xl");
  });

  it("renders the name and a short date row", () => {
    render(<TransactionView tx={makeTx({})} wallet={wallet} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText(/21 Nov 2026/)).toBeInTheDocument();
  });

  it("shows notes only when present", () => {
    const { rerender } = render(
      <TransactionView tx={makeTx({ notes: "Weekly shop" })} wallet={wallet} />,
    );
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Weekly shop")).toHaveClass("whitespace-pre-wrap");
    rerender(<TransactionView tx={makeTx({ notes: "" })} wallet={wallet} />);
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("opens the subscription from the Recurring button", () => {
    const onOpenSubscription = vi.fn();
    render(
      <TransactionView
        tx={makeTx({ subscriptionId: "sub-1" })}
        wallet={wallet}
        onOpenSubscription={onOpenSubscription}
      />,
    );
    const button = screen.getByRole("button", { name: /Recurring/ });
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(onOpenSubscription).toHaveBeenCalledWith("sub-1");
  });

  it("hides the Recurring button for one-off transactions", () => {
    render(<TransactionView tx={makeTx({})} wallet={wallet} />);
    expect(
      screen.queryByRole("button", { name: /Recurring/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the exchange rate section for a foreign currency", () => {
    render(
      <TransactionView
        tx={makeTx({ originalCurrency: "USD", originalAmount: 50 } as never)}
        wallet={wallet}
      />,
    );
    expect(screen.getByTestId("exchange")).toBeInTheDocument();
  });
});
