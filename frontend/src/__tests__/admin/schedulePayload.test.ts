import { describe, it, expect } from "vitest";
import { buildSchedulePayload } from "../../admin/schedulePayload";

const base = {
  frequency: "DAILY",
  hourOfDay: 3,
  minuteOfHour: 0,
  daysOfWeek: ["MON"],
  dayOfMonth: 5,
  monthOfYear: 6,
};

describe("buildSchedulePayload", () => {
  it("strips daysOfWeek/dayOfMonth/monthOfYear for DAILY", () => {
    expect(buildSchedulePayload(base)).toEqual({
      frequency: "DAILY",
      hourOfDay: 3,
      minuteOfHour: 0,
      daysOfWeek: [],
      dayOfMonth: null,
      monthOfYear: null,
    });
  });

  it("keeps daysOfWeek only for WEEKLY", () => {
    expect(
      buildSchedulePayload({ ...base, frequency: "WEEKLY" }).daysOfWeek,
    ).toEqual(["MON"]);
    expect(
      buildSchedulePayload({ ...base, frequency: "WEEKLY" }).dayOfMonth,
    ).toBeNull();
  });

  it("keeps dayOfMonth only for MONTHLY", () => {
    const p = buildSchedulePayload({ ...base, frequency: "MONTHLY" });
    expect(p.dayOfMonth).toBe(5);
    expect(p.monthOfYear).toBeNull();
    expect(p.daysOfWeek).toEqual([]);
  });

  it("keeps dayOfMonth and monthOfYear for YEARLY", () => {
    const p = buildSchedulePayload({ ...base, frequency: "YEARLY" });
    expect(p.dayOfMonth).toBe(5);
    expect(p.monthOfYear).toBe(6);
  });
});
