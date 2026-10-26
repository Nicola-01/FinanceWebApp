import { describe, expect, it } from "vitest";
import { MONTH_LABELS } from "../../utils/months";

describe("MONTH_LABELS", () => {
  it("lists the 12 short month names indexed by getMonth()", () => {
    expect(MONTH_LABELS).toHaveLength(12);
    expect(MONTH_LABELS[new Date(2026, 0, 1).getMonth()]).toBe("Jan");
    expect(MONTH_LABELS[11]).toBe("Dec");
  });
});
