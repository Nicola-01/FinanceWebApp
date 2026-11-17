import { describe, expect, it } from "vitest";
import { upcomingSubscriptionSpend } from "../../../dashboard/budget/budgetUpcoming";
import type { Budget, Subscription, Tag } from "../../../types/domain";

const today = new Date(2026, 10, 16); // 16 Nov 2026

const budget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "b1",
  name: "Monthly",
  tagName: null,
  limitAmount: 1200,
  periodType: "MONTHLY",
  startDate: "2026-11-01",
  endDate: null,
  rollover: false,
  alertThresholds: [],
  periodStart: "2026-11-01",
  periodEnd: "2026-11-30",
  spent: 0,
  effectiveLimit: 1200,
  remaining: 1200,
  percentUsed: 0,
  status: "OK",
  crossedThresholds: [],
  active: true,
  ...overrides,
});

const tag = (name: string, parentName: string | null = null): Tag => ({
  name,
  icon: "tag",
  colorHex: "#000000",
  parentName,
});

const sub = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: "s1",
  name: "Gym",
  tag: tag("Health"),
  amount: 50,
  originalAmount: 50,
  originalCurrency: "EUR",
  exchangeValue: 1,
  autoExchangeRate: false,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-10-20",
  nextExecutionDate: "2026-11-20",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  executedTimes: 1,
  ...overrides,
});

describe("upcomingSubscriptionSpend", () => {
  it("sums due expense subscriptions for a whole-wallet budget", () => {
    const subs = [
      sub({ id: "gym", amount: 50 }),
      sub({
        id: "rent",
        name: "Rent",
        tag: tag("Home"),
        amount: 700,
        startDate: "2026-11-30",
        nextExecutionDate: "2026-11-30",
      }),
    ];
    // Gym on 20 Nov, rent on 30 Nov (period end is inclusive).
    expect(upcomingSubscriptionSpend(budget(), subs, [], today)).toBe(750);
  });

  it("excludes today and dates after the period end", () => {
    const subs = [
      sub({
        startDate: "2026-11-16",
        nextExecutionDate: "2026-11-16",
      }),
      sub({
        startDate: "2026-12-01",
        nextExecutionDate: "2026-12-01",
      }),
    ];
    expect(upcomingSubscriptionSpend(budget(), subs, [], today)).toBe(0);
  });

  it("counts every occurrence of a monthly subscription in a yearly budget", () => {
    const yearly = budget({
      periodType: "YEARLY",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
    });
    // Monthly on the 20th: 20 Nov and 20 Dec are still ahead.
    expect(
      upcomingSubscriptionSpend(yearly, [sub({ amount: 10 })], [], today),
    ).toBe(20);
  });

  it("scopes a tag budget to the tag and its child tags", () => {
    const tags = [
      tag("Food"),
      tag("Groceries", "Food"),
      tag("Snacks", "Groceries"),
      tag("Rent"),
    ];
    const subs = [
      sub({ id: "root", tag: tag("Food"), amount: 1 }),
      sub({ id: "child", tag: tag("Groceries", "Food"), amount: 10 }),
      sub({ id: "grandchild", tag: tag("Snacks", "Groceries"), amount: 100 }),
      sub({ id: "other", tag: tag("Rent"), amount: 1000 }),
    ];
    expect(
      upcomingSubscriptionSpend(budget({ tagName: "Food" }), subs, tags, today),
    ).toBe(111);
    // A child budget does not pick up its parent's subscriptions.
    expect(
      upcomingSubscriptionSpend(
        budget({ tagName: "Groceries" }),
        subs,
        tags,
        today,
      ),
    ).toBe(110);
  });

  it("skips subscriptions on investment tags, including children of a flagged tag", () => {
    const tags: Tag[] = [
      { ...tag("Fund"), investment: true },
      tag("Index", "Fund"),
      tag("Health"),
    ];
    const subs = [
      sub({ id: "pac", tag: tag("Fund"), amount: 200 }),
      sub({ id: "pac-child", tag: tag("Index", "Fund"), amount: 100 }),
      sub({ id: "gym", tag: tag("Health"), amount: 50 }),
    ];
    expect(upcomingSubscriptionSpend(budget(), subs, tags, today)).toBe(50);
  });

  it("skips income, paused, ended, bank-driven and amount-less subscriptions", () => {
    const subs = [
      sub({ id: "income", type: "INCOME", amount: 500 }),
      sub({ id: "paused", status: "PAUSED", amount: 40 }),
      sub({
        id: "ended",
        duration: "UNTIL",
        durationUntil: "2026-11-18",
        amount: 30,
      }),
      sub({ id: "bank", bankDriven: true, amount: 20 }),
      sub({ id: "reminder", amountPending: true, amount: 0 }),
      sub({ id: "free", amount: 0 }),
    ];
    expect(upcomingSubscriptionSpend(budget(), subs, [], today)).toBe(0);
  });
});
