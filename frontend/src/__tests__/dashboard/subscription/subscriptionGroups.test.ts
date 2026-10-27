import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Subscription, Transaction } from "../../../types/domain";
import {
  formatMonthLabel,
  groupSubscriptions,
  monthKeyOf,
} from "../../../dashboard/subscription/subscriptionGroups";

const sub = (over: Partial<Subscription>) =>
  ({
    id: "s",
    status: "ACTIVE",
    nextExecutionDate: "2026-03-12",
    history: [],
    ...over,
  }) as unknown as Subscription;
const tx = (id: string, transactionDate: string) =>
  ({ id, transactionDate, amount: 1 }) as Transaction;

describe("subscriptionGroups", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 12));
  });
  afterEach(() => vi.useRealTimers());

  it("monthKeyOf / formatMonthLabel", () => {
    expect(monthKeyOf(new Date(2026, 0, 31))).toBe("2026-01");
    expect(formatMonthLabel("2026-03")).toBe("March 2026");
  });

  it("splits upcoming by 7 days (sorted soonest first) and completed", () => {
    const r = groupSubscriptions([
      sub({ id: "far", nextExecutionDate: "2026-03-30" }),
      sub({ id: "soon2", nextExecutionDate: "2026-03-15" }),
      sub({ id: "soon1", nextExecutionDate: "2026-03-11" }),
      sub({ id: "done", status: "COMPLETED" }),
      // Missing date: in neither upcoming group (NaN semantics).
      sub({ id: "nodate", nextExecutionDate: "" }),
    ]);
    expect(r.within7Days.map((s) => s.id)).toEqual(["soon1", "soon2"]);
    expect(r.within31Days.map((s) => s.id)).toEqual(["far"]);
    expect(r.completedSubs.map((s) => s.id)).toEqual(["done"]);
    expect(r.hasPast).toBe(false);
    expect(r.sortedMonthKeys).toEqual([]);
  });

  it("buckets history by month, newest month first", () => {
    const a = sub({
      id: "a",
      history: [tx("1", "2026-01-05"), tx("2", "2026-02-05")],
    });
    const b = sub({ id: "b", history: [tx("3", "2026-02-20")] });
    const r = groupSubscriptions([a, b]);
    expect(r.hasPast).toBe(true);
    expect(r.sortedMonthKeys).toEqual(["2026-02", "2026-01"]);
    expect(r.groupedPastSubs["2026-02"]).toEqual([
      { sub: a, tx: a.history![1] },
      { sub: b, tx: b.history![0] },
    ]);
  });
});
