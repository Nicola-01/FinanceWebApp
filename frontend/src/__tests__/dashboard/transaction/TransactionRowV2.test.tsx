import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TransactionRowV2 } from "../../../dashboard/transaction/TransactionRowV2";
import type { Transaction } from "../../../types/domain";

vi.mock("../../../dashboard/transaction/ToCategoriseActions.tsx", () => ({
  ToCategoriseActions: () => <div data-testid="review-actions" />,
}));

const tx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "1",
  name: "OpenAI",
  notes: "",
  tag: { name: "Food", icon: "bank", colorHex: "#9ca3af" },
  amount: 10,
  originalAmount: 10,
  originalCurrency: "EUR",
  type: "EXPENSE",
  transactionDate: "2026-06-27",
  needsReview: false,
  ...overrides,
});

const renderRow = (t: Transaction, onClick = vi.fn()) => {
  render(
    <TransactionRowV2
      transaction={t}
      onClick={onClick}
      isFirst
      isLast={false}
    />,
  );
  return onClick;
};

describe("TransactionRowV2", () => {
  it("shows the tag name as the title when the transaction has no name", () => {
    renderRow(tx({ name: "  " }));
    expect(
      screen.getByText("Food", { selector: ".font-semibold" }),
    ).toBeInTheDocument();
  });

  it("shows the transaction name as the title", () => {
    renderRow(tx());
    expect(
      screen.getByText("OpenAI", { selector: ".font-semibold" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("signs income as + in the income colour and expenses as - in the text colour", () => {
    const { unmount } = render(
      <TransactionRowV2
        transaction={tx({ type: "INCOME", amount: 12345.5 })}
        onClick={vi.fn()}
        isFirst
        isLast
      />,
    );
    const income = screen.getByText(/^\+12\.345,50/);
    expect(income).toHaveClass("text-app-income");
    unmount();

    renderRow(tx({ amount: 10 }));
    const expense = screen.getByText(/^−10,00/);
    expect(expense).toHaveClass("text-app-text");
    expect(expense).not.toHaveClass("text-app-income");
  });

  it("appends the notes after the category, unless they only repeat the name", () => {
    const { unmount } = render(
      <TransactionRowV2
        transaction={tx({ notes: "OPENAI " })}
        onClick={vi.fn()}
        isFirst
        isLast
      />,
    );
    expect(screen.queryByText(/·/)).toBeNull();
    unmount();

    renderRow(tx({ notes: "Plus plan" }));
    expect(screen.getByText("· Plus plan")).toBeInTheDocument();
  });

  it("marks recurring rows", () => {
    renderRow(tx({ subscriptionId: "s1" }));
    expect(screen.getByTitle("Recurring payment")).toBeInTheDocument();
  });

  it("renders a to-categorise row with the review glyph, the placeholder label and inline actions", () => {
    const { container } = render(
      <TransactionRowV2
        transaction={tx({
          needsReview: true,
          tag: { name: "To categorise", icon: "bank", colorHex: "#999" },
        })}
        onClick={vi.fn()}
        isFirst
        isLast
      />,
    );
    expect(container.querySelector(".fa-left-right")).not.toBeNull();
    expect(
      screen.getByText("To categorise", { selector: ".truncate" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("review-actions")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass(
      "shadow-[inset_3px_0_0_var(--color-app-warn)]",
    );
  });

  it("calls onClick on click", () => {
    const onClick = renderRow(tx());
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is keyboard accessible with Enter and Space", () => {
    const onClick = renderRow(tx());
    const row = screen.getByRole("button");
    expect(row).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("ignores key presses bubbling up from inside the row controls", () => {
    const onClick = vi.fn();
    render(
      <TransactionRowV2
        transaction={tx({ needsReview: true })}
        onClick={onClick}
        isFirst
        isLast
      />,
    );
    fireEvent.keyDown(screen.getByTestId("review-actions"), { key: "Enter" });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not repeat the category under a title that already is the category", () => {
    renderRow(tx({ name: "Food" }));
    expect(screen.getAllByText("Food")).toHaveLength(1);
    expect(document.querySelector('[class*="text-[13px]"]')).toBeNull();
  });

  it("keeps the recurring mark and notes when the category is not repeated", () => {
    renderRow(tx({ name: "Food", subscriptionId: "s1", notes: "Plus plan" }));
    expect(screen.getByTitle("Recurring payment")).toBeInTheDocument();
    expect(screen.getByText("Plus plan")).toBeInTheDocument();
    expect(screen.getAllByText("Food")).toHaveLength(1);
  });
});
