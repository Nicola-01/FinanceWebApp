import { describe, it, expect } from "vitest";
import {
  defaultRuleForMode,
  describeMonthlyRule,
  EMPTY_MONTHLY_RULE,
  monthlyRuleFromSub,
  monthlyRuleMode,
  monthlyRulePayload,
  ordinalLabel,
} from "../../utils/monthlyRule";
import type { Subscription } from "../../types/domain";

const sub = (over: Partial<Subscription>) =>
  ({
    frequencyType: "MONTHLY",
    lastWorkingDayOfMonth: false,
    ...over,
  }) as Subscription;

describe("monthlyRule", () => {
  it("ordinalLabel", () => {
    expect([1, 2, 3, 4, 11, 21, 22, -1, -2, -3].map(ordinalLabel)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "21st",
      "22nd",
      "last",
      "2nd to last",
      "3rd to last",
    ]);
  });

  it("derives the mode from the set field", () => {
    expect(monthlyRuleMode(EMPTY_MONTHLY_RULE)).toBe("DAY");
    expect(
      monthlyRuleMode({ ...EMPTY_MONTHLY_RULE, monthlyWorkingDay: -1 }),
    ).toBe("WORKING_DAY");
    expect(
      monthlyRuleMode({
        ...EMPTY_MONTHLY_RULE,
        monthlyWeekday: "MONDAY",
        monthlyWeekdayOrdinal: 1,
      }),
    ).toBe("WEEKDAY");
  });

  it("defaults per mode come from the start date", () => {
    // Thu 19 Nov 2026 → 3rd Thursday
    expect(defaultRuleForMode("WEEKDAY", new Date(2026, 10, 19))).toMatchObject(
      {
        monthlyWeekday: "THURSDAY",
        monthlyWeekdayOrdinal: 3,
      },
    );
    // Day 30 caps to the 4th
    expect(
      defaultRuleForMode("WEEKDAY", new Date(2026, 10, 30))
        .monthlyWeekdayOrdinal,
    ).toBe(4);
    expect(
      defaultRuleForMode("WORKING_DAY", new Date()).monthlyWorkingDay,
    ).toBe(-1);
    expect(defaultRuleForMode("DAY", new Date())).toEqual(EMPTY_MONTHLY_RULE);
  });

  it("monthlyRuleFromSub maps the legacy flag and the implicit start day", () => {
    const start = new Date(2026, 0, 15);
    expect(
      monthlyRuleFromSub(sub({ lastWorkingDayOfMonth: true }), start)
        .monthlyWorkingDay,
    ).toBe(-1);
    expect(
      monthlyRuleFromSub(sub({ monthlySpecificDay: 15 }), start)
        .monthlySpecificDay,
    ).toBeNull();
    expect(
      monthlyRuleFromSub(sub({ monthlySpecificDay: -1 }), start)
        .monthlySpecificDay,
    ).toBe(-1);
  });

  it("payload pins the start day, clears rules for non-monthly", () => {
    const start = new Date(2026, 0, 31);
    expect(monthlyRulePayload(EMPTY_MONTHLY_RULE, "MONTHLY", start)).toEqual({
      ...EMPTY_MONTHLY_RULE,
      monthlySpecificDay: 31,
      lastWorkingDayOfMonth: false,
    });
    expect(
      monthlyRulePayload(
        { ...EMPTY_MONTHLY_RULE, monthlyWorkingDay: 2 },
        "MONTHLY",
        start,
      ),
    ).toMatchObject({ monthlySpecificDay: null, monthlyWorkingDay: 2 });
    expect(
      monthlyRulePayload(
        { ...EMPTY_MONTHLY_RULE, monthlyWorkingDay: 2 },
        "WEEKLY",
        start,
      ),
    ).toEqual({ ...EMPTY_MONTHLY_RULE, lastWorkingDayOfMonth: false });
  });

  it("describeMonthlyRule", () => {
    expect(describeMonthlyRule(sub({ lastWorkingDayOfMonth: true }))).toBe(
      "on the last working day",
    );
    expect(
      describeMonthlyRule(
        sub({ monthlyWeekday: "TUESDAY", monthlyWeekdayOrdinal: 2 }),
      ),
    ).toBe("on the 2nd Tuesday");
    expect(describeMonthlyRule(sub({ monthlySpecificDay: -2 }))).toBe(
      "on the 2nd to last day",
    );
    expect(describeMonthlyRule(sub({ monthlySpecificDay: 27 }))).toBe(
      "on the 27th",
    );
    expect(describeMonthlyRule(sub({}))).toBeNull();
    expect(
      describeMonthlyRule(
        sub({ frequencyType: "WEEKLY", monthlySpecificDay: 3 }),
      ),
    ).toBeNull();
  });
});
