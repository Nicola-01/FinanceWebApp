import { describe, it, expect, vi, afterEach } from "vitest";
import {
  durationChangePatch,
  parseIsoDate,
} from "../../../../../modals/wallet/wizardSteps/subscriptionModes/stagedSubscriptionEdits";
import type { SubscriptionRequest } from "../../../../../dashboard/settings/csvImport";

const sub = (over: Partial<SubscriptionRequest> = {}): SubscriptionRequest => ({
  name: "Netflix",
  tag: "Fun",
  amount: 10,
  type: "EXPENSE",
  status: "ACTIVE",
  startDate: "2026-01-01",
  frequencyType: "MONTHLY",
  frequencyInterval: 1,
  lastWorkingDayOfMonth: false,
  duration: "FOREVER",
  autoExchangeRate: false,
  ...over,
});

afterEach(() => vi.useRealTimers());

describe("parseIsoDate", () => {
  it("returns null for a missing value and local midnight otherwise", () => {
    expect(parseIsoDate(undefined)).toBeNull();
    expect(parseIsoDate("")).toBeNull();
    expect(parseIsoDate("2026-03-04")).toEqual(new Date(2026, 2, 4));
  });
});

describe("durationChangePatch", () => {
  it("seeds durationTimes = 1 when switching to TIMES without one", () => {
    expect(durationChangePatch(sub(), "TIMES")).toEqual({
      duration: "TIMES",
      durationTimes: 1,
    });
  });

  it("keeps an existing durationTimes", () => {
    expect(durationChangePatch(sub({ durationTimes: 5 }), "TIMES")).toEqual({
      duration: "TIMES",
    });
  });

  it("seeds durationUntil = today (local) when switching to UNTIL without one", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 9, 0, 30));
    expect(durationChangePatch(sub(), "UNTIL")).toEqual({
      duration: "UNTIL",
      durationUntil: "2026-07-09",
    });
  });

  it("keeps an existing durationUntil and adds nothing for FOREVER", () => {
    expect(
      durationChangePatch(sub({ durationUntil: "2027-01-01" }), "UNTIL"),
    ).toEqual({ duration: "UNTIL" });
    expect(durationChangePatch(sub(), "FOREVER")).toEqual({
      duration: "FOREVER",
    });
  });
});
