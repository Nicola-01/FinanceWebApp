import { describe, expect, it } from "vitest";
import { formatAmount } from "../../utils/format";

describe("formatAmount", () => {
  it("groups thousands and always shows 2 decimals (it-IT)", () => {
    expect(formatAmount(12345.5)).toBe("12.345,50");
    expect(formatAmount(-0.456)).toBe("-0,46");
  });

  it("renders 0 as a number by default", () => {
    expect(formatAmount(0)).toBe("0,00");
  });

  it("renders 0 as a dash with zeroAsDash", () => {
    expect(formatAmount(0, { zeroAsDash: true })).toBe("—");
    expect(formatAmount(12, { zeroAsDash: true })).toBe("12,00");
  });
});
