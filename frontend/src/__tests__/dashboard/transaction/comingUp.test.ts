import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Subscription } from "../../../types/domain";
import {
  comingUpLabel,
  getComingUp,
} from "../../../dashboard/transaction/comingUp";

const TODAY = new Date(2026, 10, 12); // 12 Nov 2026, local time

const sub = (
  id: string,
  daysAhead: number,
  patch: Partial<Subscription> = {},
) =>
  ({
    id,
    name: `Sub ${id}`,
    status: "ACTIVE",
    nextExecutionDate: new Date(2026, 10, 12 + daysAhead).toISOString(),
    ...patch,
  }) as Subscription;

describe("comingUpLabel", () => {
  it("uses today / tomorrow / in N days / in 1 month", () => {
    expect(comingUpLabel(0)).toBe("today");
    expect(comingUpLabel(1)).toBe("tomorrow");
    expect(comingUpLabel(8)).toBe("in 8 days");
    expect(comingUpLabel(28)).toBe("in 1 month");
  });
});

describe("getComingUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);
  });
  afterEach(() => vi.useRealTimers());

  it("keeps active subscriptions within 31 days, soonest first, with soon flag at <=3 days", () => {
    const items = getComingUp([
      sub("far", 20),
      sub("soon", 3),
      sub("today", 0),
      sub("edge", 31),
      sub("beyond", 32),
      sub("past", -1),
    ]);
    expect(items.map((i) => i.sub.id)).toEqual([
      "today",
      "soon",
      "far",
      "edge",
    ]);
    expect(items.map((i) => i.soon)).toEqual([true, true, false, false]);
    expect(items[0].label).toBe("today");
    expect(items[2].label).toBe("in 20 days");
  });

  it("skips paused, completed and bank-driven subscriptions", () => {
    const items = getComingUp([
      sub("paused", 2, { status: "PAUSED" }),
      sub("done", 2, { status: "COMPLETED" }),
      sub("bank", 2, { bankDriven: true }),
      sub("ok", 2),
    ]);
    expect(items.map((i) => i.sub.id)).toEqual(["ok"]);
  });

  it("returns an empty list when nothing is due", () => {
    expect(getComingUp([])).toEqual([]);
  });
});
