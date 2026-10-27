import { describe, it, expect } from "vitest";
import type { Transaction } from "../../../types/domain";
import {
  formatDateHeader,
  groupTransactionsByDate,
} from "../../../dashboard/transaction/groupTransactionsByDate";

const tx = (id: string, transactionDate: string) =>
  ({ id, transactionDate }) as Transaction;

describe("groupTransactionsByDate", () => {
  it("groups by date, keeps input order per day and sorts dates newest first", () => {
    const { groups, sortedDates } = groupTransactionsByDate([
      tx("1", "2026-03-01"),
      tx("2", "2026-03-05"),
      tx("3", "2026-03-01"),
    ]);
    expect(sortedDates).toEqual(["2026-03-05", "2026-03-01"]);
    expect(groups["2026-03-01"].map((t) => t.id)).toEqual(["1", "3"]);
    expect(groups["2026-03-05"].map((t) => t.id)).toEqual(["2"]);
  });

  it("handles an empty list", () => {
    expect(groupTransactionsByDate([])).toEqual({
      groups: {},
      sortedDates: [],
    });
  });
});

describe("formatDateHeader", () => {
  const now = new Date(2026, 2, 10, 12);
  const plain = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  it("prefixes today and yesterday", () => {
    expect(formatDateHeader("2026-03-10T08:00:00", now)).toBe(
      `Today - ${plain(new Date(2026, 2, 10))}`,
    );
    expect(formatDateHeader("2026-03-09T08:00:00", now)).toBe(
      `Yesterday - ${plain(new Date(2026, 2, 9))}`,
    );
  });

  it("returns the plain date otherwise", () => {
    expect(formatDateHeader("2026-03-01T08:00:00", now)).toBe(
      plain(new Date(2026, 2, 1)),
    );
  });
});
