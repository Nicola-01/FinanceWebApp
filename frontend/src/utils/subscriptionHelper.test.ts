import { describe, it, expect } from "vitest";
import { buildYearsMap } from "./subscriptionHelper";
import type { Subscription, Tag, Transaction } from "./types";

const makeSub = (over: Partial<Subscription>): Subscription => ({
  id: "s1",
  name: "Netflix",
  tag: { name: "t", colorHex: "#fff", icon: "tag" } as unknown as Tag,
  amount: 10,
  originalAmount: 10,
  originalCurrency: "EUR",
  exchangeValue: 1,
  autoExchangeRate: false,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2025-01-10",
  nextExecutionDate: "2025-01-10T12:00:00",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  executedTimes: 0,
  ...over,
});

const makeTx = (transactionDate: string, id = "tx"): Transaction =>
  ({ id, name: "past", transactionDate }) as unknown as Transaction;

describe("buildYearsMap", () => {
  it("maps history transactions of the target year to their day", () => {
    const sub = makeSub({
      status: "COMPLETED", // isola: niente occorrenze future
      history: [makeTx("2025-03-15T12:00:00")],
    });

    const map = buildYearsMap([sub], [2025]);

    expect(map[2025]["2025-03-15"]).toBeDefined();
    expect(map[2025]["2025-03-15"].map((s) => s.id)).toEqual(["s1"]);
  });

  it("excludes history transactions from other years", () => {
    const sub = makeSub({
      status: "COMPLETED",
      history: [makeTx("2024-06-01T12:00:00")],
    });

    const map = buildYearsMap([sub], [2025]);

    expect(map[2025]).toEqual({});
  });

  it("skips future occurrences for COMPLETED subscriptions", () => {
    const sub = makeSub({ status: "COMPLETED" }); // nessuna history

    const map = buildYearsMap([sub], [2025]);

    expect(map[2025]).toEqual({});
  });

  it("does not duplicate a subscription on the same day", () => {
    const sub = makeSub({
      status: "COMPLETED",
      history: [
        makeTx("2025-03-15T12:00:00", "a"),
        makeTx("2025-03-15T12:00:00", "b"),
      ],
    });

    const map = buildYearsMap([sub], [2025]);

    expect(map[2025]["2025-03-15"]).toHaveLength(1);
  });

  it("includes only future occurrences on/after nextExecutionDate", () => {
    const sub = makeSub({
      status: "ACTIVE",
      startDate: "2025-01-10",
      nextExecutionDate: "2025-06-10T12:00:00",
    });

    const map = buildYearsMap([sub], [2025]);

    // Occorrenza prima della nextExecutionDate: esclusa
    expect(map[2025]["2025-01-10"]).toBeUndefined();
    // Occorrenza sulla nextExecutionDate: inclusa
    expect(map[2025]["2025-06-10"]?.map((s) => s.id)).toEqual(["s1"]);
  });

  it("builds an independent map per requested year", () => {
    const sub = makeSub({
      status: "COMPLETED",
      history: [makeTx("2024-12-31T12:00:00"), makeTx("2025-01-01T12:00:00")],
    });

    const map = buildYearsMap([sub], [2024, 2025]);

    expect(Object.keys(map[2024])).toEqual(["2024-12-31"]);
    expect(Object.keys(map[2025])).toEqual(["2025-01-01"]);
  });
});
