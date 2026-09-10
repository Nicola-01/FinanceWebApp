import { describe, expect, it } from "vitest";
import { parseLocalIsoDate, toLocalIsoDate } from "../../utils/localDate";

describe("toLocalIsoDate", () => {
  it("zero-pads single-digit months and days", () => {
    expect(toLocalIsoDate(new Date(2026, 8, 9))).toBe("2026-09-09");
  });

  it("keeps month and day in ISO order regardless of the browser locale", () => {
    // Regression: `toLocaleDateString().split("/").reverse()` turned
    // 10 Sep 2026 into "2026-10-9" under en-US.
    expect(toLocalIsoDate(new Date(2026, 8, 10))).toBe("2026-09-10");
    expect(toLocalIsoDate(new Date(2026, 9, 11))).toBe("2026-10-11");
  });

  it("uses the local calendar day, not the UTC one", () => {
    expect(toLocalIsoDate(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
    expect(toLocalIsoDate(new Date(2027, 0, 1, 0, 0))).toBe("2027-01-01");
  });
});

describe("parseLocalIsoDate", () => {
  it("parses YYYY-MM-DD to local midnight of that day", () => {
    const d = parseLocalIsoDate("2026-09-10");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(10);
    expect(d.getHours()).toBe(0);
  });

  it("round-trips with toLocalIsoDate", () => {
    expect(toLocalIsoDate(parseLocalIsoDate("2026-02-28"))).toBe("2026-02-28");
  });

  it("falls back to the Date constructor for other formats", () => {
    const iso = "2026-09-10T12:34:56Z";
    expect(parseLocalIsoDate(iso).getTime()).toBe(new Date(iso).getTime());
  });
});
