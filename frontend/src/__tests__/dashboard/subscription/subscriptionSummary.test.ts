import { describe, it, expect } from "vitest";
import type { Subscription } from "../../../types/domain";
import {
  formatDueRelative,
  formatEvery,
  monthlyEquivalent,
  summarizeSubscriptions,
  dueToneClass,
} from "../../../dashboard/subscription/subscriptionSummary";

const sub = (over: Partial<Subscription>) =>
  ({
    id: "s",
    name: "Netflix",
    type: "EXPENSE",
    amount: 12,
    status: "ACTIVE",
    frequencyType: "MONTHLY",
    frequencyInterval: 1,
    tag: { name: "Fun", icon: "tag", colorHex: "#f00" },
    ...over,
  }) as unknown as Subscription;

describe("monthlyEquivalent", () => {
  it("normalises each frequency to a monthly amount", () => {
    expect(monthlyEquivalent(sub({ frequencyType: "MONTHLY" }))).toBe(12);
    expect(
      monthlyEquivalent(
        sub({ frequencyType: "MONTHLY", frequencyInterval: 3 }),
      ),
    ).toBeCloseTo(4);
    expect(
      monthlyEquivalent(sub({ frequencyType: "YEARLY", amount: 120 })),
    ).toBeCloseTo(10);
    expect(
      monthlyEquivalent(
        sub({ frequencyType: "YEARLY", amount: 120, frequencyInterval: 2 }),
      ),
    ).toBeCloseTo(5);
    expect(
      monthlyEquivalent(sub({ frequencyType: "WEEKLY", amount: 10 })),
    ).toBeCloseTo((10 * 52) / 12);
    expect(
      monthlyEquivalent(
        sub({ frequencyType: "WEEKLY", amount: 10, frequencyInterval: 2 }),
      ),
    ).toBeCloseTo((10 * 52) / 12 / 2);
    expect(
      monthlyEquivalent(sub({ frequencyType: "DAILY", amount: 1 })),
    ).toBeCloseTo(365 / 12);
    expect(
      monthlyEquivalent(
        sub({ frequencyType: "DAILY", amount: 1, frequencyInterval: 7 }),
      ),
    ).toBeCloseTo(365 / 12 / 7);
  });

  it("counts inactive, bank-driven and reminder rows as zero", () => {
    expect(monthlyEquivalent(sub({ status: "PAUSED" }))).toBe(0);
    expect(monthlyEquivalent(sub({ status: "COMPLETED" }))).toBe(0);
    expect(monthlyEquivalent(sub({ bankDriven: true }))).toBe(0);
    expect(monthlyEquivalent(sub({ amountPending: true }))).toBe(0);
  });
});

describe("summarizeSubscriptions", () => {
  it("sums costs, yearly cost and income separately", () => {
    const s = summarizeSubscriptions([
      sub({ id: "a", amount: 10 }),
      sub({ id: "b", amount: 120, frequencyType: "YEARLY" }),
      sub({ id: "i", type: "INCOME", amount: 1750 }),
      sub({ id: "p", amount: 99, status: "PAUSED" }),
    ]);
    expect(s.monthlyCost).toBeCloseTo(20);
    expect(s.yearlyCost).toBeCloseTo(240);
    expect(s.monthlyIncome).toBeCloseTo(1750);
    expect(s.costSegments.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("keeps the top 5 costs and folds the rest into Other", () => {
    const subs = [1, 2, 3, 4, 5, 6, 7].map((i) =>
      sub({ id: `s${i}`, name: `S${i}`, amount: i }),
    );
    const s = summarizeSubscriptions(subs);
    expect(s.costSegments).toHaveLength(6);
    expect(s.costSegments[0]).toMatchObject({ id: "s7", value: 7 });
    expect(s.costSegments[5]).toMatchObject({ id: "other", label: "Other" });
    expect(s.costSegments[5].value).toBeCloseTo(1 + 2);
  });

  it("returns no segments when there are no costs", () => {
    expect(summarizeSubscriptions([]).costSegments).toEqual([]);
  });
});

describe("formatEvery", () => {
  it("names the unit, with the interval when above one", () => {
    expect(formatEvery(sub({ frequencyType: "DAILY" }))).toBe("every day");
    expect(formatEvery(sub({ frequencyType: "WEEKLY" }))).toBe("every week");
    expect(formatEvery(sub({ frequencyType: "MONTHLY" }))).toBe("every month");
    expect(formatEvery(sub({ frequencyType: "YEARLY" }))).toBe("every year");
    expect(
      formatEvery(sub({ frequencyType: "WEEKLY", frequencyInterval: 2 })),
    ).toBe("every 2 weeks");
  });
});

describe("formatDueRelative / dueToneClass", () => {
  it("formats overdue, near and far due dates", () => {
    expect(formatDueRelative(-2)).toBe("2 days overdue");
    expect(formatDueRelative(-1)).toBe("1 day overdue");
    expect(formatDueRelative(0)).toBe("Today");
    expect(formatDueRelative(1)).toBe("in 1 day");
    expect(formatDueRelative(3)).toBe("in 3 days");
    expect(formatDueRelative(45)).toBe("in 2 months");
    expect(formatDueRelative(30)).toBe("in 1 month");
  });

  it("tones overdue red, due within 3 days amber, the rest muted", () => {
    expect(dueToneClass(-1)).toBe("text-app-danger");
    expect(dueToneClass(0)).toBe("text-app-warn");
    expect(dueToneClass(3)).toBe("text-app-warn");
    expect(dueToneClass(4)).toBe("text-app-muted");
  });
});
