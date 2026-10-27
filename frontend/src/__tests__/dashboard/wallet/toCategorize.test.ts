import { describe, expect, it } from "vitest";
import { selectToCategorize } from "../../../dashboard/wallet/toCategorize";
import type { Transaction } from "../../../types/domain";

const tx = (id: string, date: string, needsReview?: boolean) =>
  ({ id, transactionDate: date, needsReview }) as Transaction;

describe("selectToCategorize", () => {
  it("keeps only needsReview, newest first", () => {
    const out = selectToCategorize([
      tx("a", "2026-01-01", true),
      tx("b", "2026-03-01", false),
      tx("c", "2026-02-01", true),
      tx("d", "2026-04-01"),
    ]);
    expect(out.map((t) => t.id)).toEqual(["c", "a"]);
  });
});
