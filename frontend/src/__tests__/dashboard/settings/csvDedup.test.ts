import { describe, it, expect } from "vitest";
import {
  detectTagOverwrites,
  detectTransactionOverwrites,
  detectSubscriptionOverwrites,
} from "../../../dashboard/settings/csvDedup";
import type {
  TransactionRequest,
  TagRequest,
  SubscriptionRequest,
} from "../../../dashboard/settings/csvImport";
import type { Subscription, Tag, Transaction } from "../../../utils/types";

// --- Fixture builders -------------------------------------------------------

const tag = (name: string): Tag => ({
  name,
  icon: "tag",
  colorHex: "#60a5fa",
});

const tx = (
  name: string,
  tagName: string,
  transactionDate: string,
): Transaction => ({
  id: `t-${name}-${transactionDate}`,
  name,
  tag: tag(tagName),
  amount: 10,
  type: "EXPENSE",
  transactionDate,
});

const sub = (
  name: string,
  tagName: string,
  startDate: string,
): Subscription => ({
  id: `s-${name}`,
  name,
  tag: tag(tagName),
  amount: 10,
  originalAmount: 0,
  originalCurrency: "",
  exchangeValue: 0,
  autoExchangeRate: false,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate,
  nextExecutionDate: startDate,
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  executedTimes: 0,
});

// --- Tags -------------------------------------------------------------------

describe("detectTagOverwrites", () => {
  const txReq = (name: string): TagRequest => ({
    name,
    icon: "tag",
    colorHex: "#000000",
  });

  it("flags a same-name tag as an overwrite and counts the rest as new", () => {
    const { overwrites, newCount } = detectTagOverwrites(
      [txReq("Food"), txReq("Travel")],
      [tag("Food")],
    );
    expect(newCount).toBe(1);
    expect(overwrites).toEqual([{ label: "Food" }]);
  });

  it("matches names case-insensitively and after trimming", () => {
    const { overwrites, newCount } = detectTagOverwrites(
      [{ name: "  fOOd  ", icon: "x", colorHex: "#111" }],
      [tag("Food")],
    );
    expect(newCount).toBe(0);
    expect(overwrites).toHaveLength(1);
    expect(overwrites[0].label).toBe("  fOOd  ");
  });

  it("treats everything as new when the wallet has no tags", () => {
    const { overwrites, newCount } = detectTagOverwrites(
      [txReq("Food"), txReq("Travel")],
      [],
    );
    expect(newCount).toBe(2);
    expect(overwrites).toEqual([]);
  });
});

// --- Transactions -----------------------------------------------------------

describe("detectTransactionOverwrites", () => {
  const req = (
    name: string,
    tagName: string,
    transactionDate: string,
  ): TransactionRequest => ({
    name,
    tag: tagName,
    amount: 10,
    type: "EXPENSE",
    transactionDate,
  });

  it("flags a match on name + tag + date", () => {
    const { overwrites, newCount } = detectTransactionOverwrites(
      [req("Lunch", "Food", "2026-06-01")],
      [tx("Lunch", "Food", "2026-06-01")],
    );
    expect(newCount).toBe(0);
    expect(overwrites).toEqual([
      { label: "Lunch", detail: "Food · 2026-06-01" },
    ]);
  });

  it("is new when only the date differs", () => {
    const { overwrites, newCount } = detectTransactionOverwrites(
      [req("Lunch", "Food", "2026-06-02")],
      [tx("Lunch", "Food", "2026-06-01")],
    );
    expect(newCount).toBe(1);
    expect(overwrites).toEqual([]);
  });

  it("is new when only the tag differs", () => {
    const { overwrites, newCount } = detectTransactionOverwrites(
      [req("Lunch", "Travel", "2026-06-01")],
      [tx("Lunch", "Food", "2026-06-01")],
    );
    expect(newCount).toBe(1);
    expect(overwrites).toEqual([]);
  });

  it("matches name and tag case-insensitively / trimmed, date exact", () => {
    const { overwrites, newCount } = detectTransactionOverwrites(
      [req("  lunch ", " FOOD ", "2026-06-01")],
      [tx("Lunch", "Food", "2026-06-01")],
    );
    expect(newCount).toBe(0);
    expect(overwrites).toHaveLength(1);
  });
});

// --- Subscriptions ----------------------------------------------------------

describe("detectSubscriptionOverwrites", () => {
  const req = (
    name: string,
    tagName: string,
    startDate: string,
  ): SubscriptionRequest => ({
    name,
    tag: tagName,
    amount: 10,
    type: "EXPENSE",
    status: "ACTIVE",
    startDate,
    frequencyType: "MONTHLY",
    frequencyInterval: 1,
    lastWorkingDayOfMonth: false,
    duration: "FOREVER",
    autoExchangeRate: false,
  });

  it("flags a match on tag + startDate (name is ignored)", () => {
    const { overwrites, newCount } = detectSubscriptionOverwrites(
      [req("Netflix renamed", "Entertainment", "2026-01-01")],
      [sub("Netflix", "Entertainment", "2026-01-01")],
    );
    expect(newCount).toBe(0);
    expect(overwrites).toEqual([
      { label: "Netflix renamed", detail: "Entertainment · 2026-01-01" },
    ]);
  });

  it("is new when the startDate differs", () => {
    const { overwrites, newCount } = detectSubscriptionOverwrites(
      [req("Netflix", "Entertainment", "2026-02-01")],
      [sub("Netflix", "Entertainment", "2026-01-01")],
    );
    expect(newCount).toBe(1);
    expect(overwrites).toEqual([]);
  });

  it("matches the tag case-insensitively / trimmed", () => {
    const { overwrites, newCount } = detectSubscriptionOverwrites(
      [req("Netflix", "  entertainment ", "2026-01-01")],
      [sub("Netflix", "Entertainment", "2026-01-01")],
    );
    expect(newCount).toBe(0);
    expect(overwrites).toHaveLength(1);
  });
});
