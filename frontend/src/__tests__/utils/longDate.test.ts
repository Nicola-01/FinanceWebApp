import { describe, it, expect } from "vitest";
import { formatLongLocalDate } from "../../utils/longDate";

describe("formatLongLocalDate", () => {
  it("formats the local calendar day of a YYYY-MM-DD prefix", () => {
    const expected = new Date(2026, 6, 2).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(formatLongLocalDate("2026-07-02")).toBe(expected);
    expect(formatLongLocalDate("2026-07-02T23:30:00Z")).toBe(expected);
  });

  it("returns non-date strings unchanged", () => {
    expect(formatLongLocalDate("dev")).toBe("dev");
  });
});
