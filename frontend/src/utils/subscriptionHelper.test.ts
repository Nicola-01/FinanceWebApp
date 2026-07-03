import { describe, it, expect } from "vitest";
import { isWeekend, format, lastDayOfMonth } from "date-fns";
import {
  buildYearsMap,
  getLastWorkingDayOfMonth,
  applyMonthlyRules,
  advanceByOneInterval,
  generateSubscriptionOccurrences,
} from "./subscriptionHelper";
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

describe("getLastWorkingDayOfMonth", () => {
  it("returns a weekday within the same month, not after the last day", () => {
    const input = new Date(2025, 4, 15); // May 2025
    const result = getLastWorkingDayOfMonth(input);
    expect(isWeekend(result)).toBe(false);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBeLessThanOrEqual(
      lastDayOfMonth(input).getDate(),
    );
  });

  it("steps back off a weekend last day", () => {
    // February 2025 ends on Friday the 28th (a weekday) — sanity anchor.
    const result = getLastWorkingDayOfMonth(new Date(2025, 1, 10));
    expect(isWeekend(result)).toBe(false);
  });
});

describe("advanceByOneInterval", () => {
  const base = new Date(2025, 0, 1); // 2025-01-01
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  it("advances DAILY by the interval", () => {
    const sub = makeSub({ frequencyType: "DAILY", frequencyInterval: 3 });
    expect(fmt(advanceByOneInterval(sub, base))).toBe("2025-01-04");
  });
  it("advances WEEKLY by the interval", () => {
    const sub = makeSub({ frequencyType: "WEEKLY", frequencyInterval: 2 });
    expect(fmt(advanceByOneInterval(sub, base))).toBe("2025-01-15");
  });
  it("advances MONTHLY by the interval", () => {
    const sub = makeSub({ frequencyType: "MONTHLY", frequencyInterval: 1 });
    expect(fmt(advanceByOneInterval(sub, new Date(2025, 0, 15)))).toBe(
      "2025-02-15",
    );
  });
  it("advances YEARLY by the interval", () => {
    const sub = makeSub({ frequencyType: "YEARLY", frequencyInterval: 1 });
    expect(fmt(advanceByOneInterval(sub, base))).toBe("2026-01-01");
  });
  it("defaults a zero/undefined interval to 1", () => {
    const sub = makeSub({ frequencyType: "DAILY", frequencyInterval: 0 });
    expect(fmt(advanceByOneInterval(sub, base))).toBe("2025-01-02");
  });
});

describe("applyMonthlyRules", () => {
  it("is a no-op for non-monthly subscriptions", () => {
    const sub = makeSub({ frequencyType: "WEEKLY" });
    const date = new Date(2025, 0, 10);
    expect(applyMonthlyRules(sub, date)).toBe(date);
  });
  it("pins to a specific day of the month", () => {
    const sub = makeSub({ frequencyType: "MONTHLY", monthlySpecificDay: 15 });
    expect(applyMonthlyRules(sub, new Date(2025, 0, 1)).getDate()).toBe(15);
  });
  it("clamps a specific day to the month length", () => {
    const sub = makeSub({ frequencyType: "MONTHLY", monthlySpecificDay: 31 });
    // February 2025 has 28 days.
    expect(applyMonthlyRules(sub, new Date(2025, 1, 1)).getDate()).toBe(28);
  });
  it("honours the last-working-day flag", () => {
    const sub = makeSub({
      frequencyType: "MONTHLY",
      lastWorkingDayOfMonth: true,
    });
    const result = applyMonthlyRules(sub, new Date(2025, 4, 1));
    expect(isWeekend(result)).toBe(false);
  });
});

describe("generateSubscriptionOccurrences", () => {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  it("generates a full year of monthly occurrences", () => {
    const sub = makeSub({
      frequencyType: "MONTHLY",
      startDate: "2025-01-10",
      duration: "FOREVER",
    });
    const occ = generateSubscriptionOccurrences(sub, 2025, 2025);
    expect(occ).toHaveLength(12);
    expect(fmt(occ[0])).toBe("2025-01-10");
  });

  it("respects the TIMES duration limit", () => {
    const sub = makeSub({
      frequencyType: "MONTHLY",
      startDate: "2025-01-10",
      duration: "TIMES",
      durationTimes: 3,
    });
    expect(generateSubscriptionOccurrences(sub, 2025, 2025)).toHaveLength(3);
  });

  it("respects the UNTIL duration limit", () => {
    const sub = makeSub({
      frequencyType: "MONTHLY",
      startDate: "2025-01-10",
      duration: "UNTIL",
      durationUntil: "2025-03-31",
    });
    expect(generateSubscriptionOccurrences(sub, 2025, 2025)).toHaveLength(3);
  });

  it("only returns occurrences within the requested year window", () => {
    const sub = makeSub({
      frequencyType: "MONTHLY",
      startDate: "2025-01-10",
      duration: "FOREVER",
    });
    const occ = generateSubscriptionOccurrences(sub, 2026, 2026);
    expect(occ).toHaveLength(12);
    expect(occ.every((d) => d.getFullYear() === 2026)).toBe(true);
  });

  it("returns nothing when there is no start date", () => {
    const sub = makeSub({ startDate: "", nextExecutionDate: "" });
    expect(generateSubscriptionOccurrences(sub, 2025, 2025)).toEqual([]);
  });
});
