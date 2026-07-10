import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TransactionRow } from "../../dashboard/transaction/TransactionRow";
import type { Transaction } from "../../utils/types";

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    name: "Lunch",
    tag: {
      name: "Food",
      icon: "faUtensils",
      colorHex: "#ff5533",
    },
    amount: 12.5,
    originalCurrency: "EUR",
    type: "EXPENSE",
    transactionDate: "2026-07-10",
    ...overrides,
  };
}

const noop = () => {};

describe("TransactionRow sync icon", () => {
  it("renders no sync glyph when the row is fully synced", () => {
    const { container } = render(
      <TransactionRow
        transaction={makeTransaction()}
        onClick={noop}
        isFirst
        isLast
      />,
    );
    expect(container.querySelector('[aria-label="Not synced yet"]')).toBeNull();
    expect(container.querySelector('[aria-label="Sync problem"]')).toBeNull();
  });

  it("renders the amber cloud-off glyph when syncState is pending", () => {
    const { container } = render(
      <TransactionRow
        transaction={makeTransaction({ syncState: "pending" })}
        onClick={noop}
        isFirst
        isLast
      />,
    );
    const icon = container.querySelector('[aria-label="Not synced yet"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("class")).toContain("text-amber-400");
  });

  it("renders the red cloud-alert glyph when syncState is conflict", () => {
    const { container } = render(
      <TransactionRow
        transaction={makeTransaction({ syncState: "conflict" })}
        onClick={noop}
        isFirst
        isLast
      />,
    );
    const icon = container.querySelector('[aria-label="Sync problem"]');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("class")).toContain("text-red-400");
  });
});
