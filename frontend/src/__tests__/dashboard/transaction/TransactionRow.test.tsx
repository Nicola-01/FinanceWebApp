import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionRow } from "../../../dashboard/transaction/TransactionRow";
import type { Transaction } from "../../../types/domain";

vi.mock("../../../dashboard/transaction/ToCategoriseActions.tsx", () => ({
  ToCategoriseActions: () => <div data-testid="review-actions" />,
}));

const tx = (needsReview: boolean, notes = ""): Transaction => ({
  id: "1",
  name: "OpenAI",
  notes,
  tag: { name: "Food", icon: "bank", colorHex: "#9ca3af" },
  amount: 10,
  originalAmount: 10,
  originalCurrency: "EUR",
  type: "EXPENSE",
  transactionDate: "2026-06-27",
  needsReview,
});

const renderRow = (t: Transaction) =>
  render(
    <TransactionRow transaction={t} onClick={vi.fn()} isFirst isLast={false} />,
  );

describe("TransactionRow", () => {
  it("renders a to-categorise row as dashed, with the arrow icon and inline actions", () => {
    const { container } = renderRow(tx(true));
    expect(container.firstElementChild).toHaveClass("border-dashed");
    expect(container.querySelector(".fa-left-right")).not.toBeNull();
    expect(screen.getByTestId("review-actions")).toBeInTheDocument();
    // The placeholder tag is never shown as a badge.
    expect(screen.queryByText("Food")).toBeNull();
  });

  it("keeps a categorised row solid, with its tag and no review actions", () => {
    const { container } = renderRow(tx(false));
    expect(container.firstElementChild).not.toHaveClass("border-dashed");
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.queryByTestId("review-actions")).toBeNull();
  });

  it("hides a note that only repeats the name", () => {
    renderRow(tx(true, "OPENAI "));
    expect(screen.getAllByText(/openai/i)).toHaveLength(1);
  });

  it("shows a distinct note", () => {
    renderRow(tx(false, "Plus plan"));
    expect(screen.getByText("Plus plan")).toBeInTheDocument();
  });
});
