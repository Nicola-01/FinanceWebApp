import { describe, it, expect } from "vitest";
import {
  formatCountdown,
  formatDuration,
  scheduleSig,
} from "../../../admin/system/jobSchedule";

const base = {
  frequency: "WEEKLY",
  hourOfDay: 2,
  minuteOfHour: 0,
  daysOfWeek: ["MON", "FRI"],
  dayOfMonth: null,
  monthOfYear: null,
};

describe("scheduleSig", () => {
  it("ignores weekday order", () => {
    expect(scheduleSig(base)).toBe(
      scheduleSig({ ...base, daysOfWeek: ["FRI", "MON"] }),
    );
    expect(scheduleSig(base)).not.toBe(scheduleSig({ ...base, hourOfDay: 3 }));
  });
});

describe("formatCountdown", () => {
  const now = Date.UTC(2025, 0, 1, 0, 0, 0);
  it("handles missing / past / short / multi-day", () => {
    expect(formatCountdown(null, now)).toBe("—");
    expect(formatCountdown(new Date(now - 1).toISOString(), now)).toBe(
      "due now",
    );
    expect(formatCountdown(new Date(now + 3_725_000).toISOString(), now)).toBe(
      "01:02:05",
    );
    expect(
      formatCountdown(
        new Date(now + 2 * 86_400_000 + 3_660_000).toISOString(),
        now,
      ),
    ).toBe("2d 1h 1m");
  });
});

describe("formatDuration", () => {
  it("scales ms / s / m s", () => {
    expect(formatDuration(250)).toBe("250ms");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(125_000)).toBe("2m 5s");
  });
});
