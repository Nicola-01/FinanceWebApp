import { describe, it, expect } from "vitest";
import {
  buildBankMatchPayload,
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

describe("buildBankMatchPayload", () => {
  it("trims the text and keeps the flags", () => {
    expect(
      buildBankMatchPayload({
        text: "  NETFLIX ",
        regex: true,
        ignoreCase: false,
        bankDriven: true,
      }),
    ).toEqual({
      bankMatchText: "NETFLIX",
      bankMatchRegex: true,
      bankMatchIgnoreCase: false,
      bankDriven: true,
    });
  });

  it("clears a blank rule and never sends date-from-bank without text", () => {
    expect(
      buildBankMatchPayload({
        text: "   ",
        regex: false,
        ignoreCase: true,
        bankDriven: true,
      }),
    ).toEqual({
      bankMatchText: "",
      bankMatchRegex: false,
      bankMatchIgnoreCase: true,
      bankDriven: false,
    });
  });
});
