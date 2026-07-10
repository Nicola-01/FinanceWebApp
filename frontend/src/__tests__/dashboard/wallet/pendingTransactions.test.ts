import { describe, expect, it } from "vitest";
import { selectPendingTransactions } from "../../../dashboard/wallet/pendingTransactions";
import type { Transaction } from "../../../utils/types";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "t1",
  name: "Salary",
  tag: { name: "Job", icon: "tag", colorHex: "#ffffff" },
  amount: 0,
  type: "INCOME",
  transactionDate: "2026-06-27",
  ...over,
});

describe("selectPendingTransactions", () => {
  it("returns only pending transactions", () => {
    const result = selectPendingTransactions([
      tx({ id: "a", amountPending: true }),
      tx({ id: "b", amount: 100 }),
    ]);
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("sorts pending transactions oldest first", () => {
    const result = selectPendingTransactions([
      tx({ id: "jun", amountPending: true, transactionDate: "2026-06-27" }),
      tx({ id: "apr", amountPending: true, transactionDate: "2026-04-27" }),
      tx({ id: "may", amountPending: true, transactionDate: "2026-05-27" }),
    ]);
    expect(result.map((t) => t.id)).toEqual(["apr", "may", "jun"]);
  });

  it("returns an empty array when nothing is pending", () => {
    expect(selectPendingTransactions([tx({})])).toEqual([]);
  });
});
