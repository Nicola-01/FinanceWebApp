import { describe, it, expect } from "vitest";
import {
  buildSchedulePayload,
  type ScheduleFields,
} from "../../../modals/subscription/subscriptionPayload";

const base: ScheduleFields = {
  status: "ACTIVE",
  startDate: new Date(2026, 0, 5),
  frequencyType: "MONTHLY",
  frequencyInterval: 2,
  duration: "FOREVER",
  durationTimes: 3,
  durationUntil: new Date(2026, 11, 31),
};

describe("buildSchedulePayload", () => {
  it("formats dates locally and drops unused duration details", () => {
    expect(buildSchedulePayload(base)).toEqual({
      status: "ACTIVE",
      startDate: "2026-01-05",
      frequencyType: "MONTHLY",
      frequencyInterval: 2,
      duration: "FOREVER",
      durationTimes: null,
      durationUntil: null,
    });
  });

  it("keeps durationTimes only for TIMES", () => {
    const p = buildSchedulePayload({ ...base, duration: "TIMES" });
    expect(p.durationTimes).toBe(3);
    expect(p.durationUntil).toBeNull();
  });

  it("keeps durationUntil only for UNTIL with a date", () => {
    const p = buildSchedulePayload({ ...base, duration: "UNTIL" });
    expect(p.durationUntil).toBe("2026-12-31");
    expect(p.durationTimes).toBeNull();
    expect(
      buildSchedulePayload({ ...base, duration: "UNTIL", durationUntil: null })
        .durationUntil,
    ).toBeNull();
  });
});
