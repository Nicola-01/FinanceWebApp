import { describe, it, expect } from "vitest";
import { formatAmountString, hasOperators } from "../../utils/amountFormat";

describe("hasOperators", () => {
  it("ignores a leading sign", () => {
    expect(hasOperators("-12.5")).toBe(false);
    expect(hasOperators("+12")).toBe(false);
    expect(hasOperators("")).toBe(false);
  });

  it("detects operators and parentheses after the sign", () => {
    expect(hasOperators("-1+2")).toBe(true);
    expect(hasOperators("3*4")).toBe(true);
    expect(hasOperators("10%")).toBe(true);
    expect(hasOperators("(2)")).toBe(true);
    expect(hasOperators("--5")).toBe(true);
  });
});

describe("formatAmountString", () => {
  it("returns empty input unchanged", () => {
    expect(formatAmountString("", "-")).toBe("");
  });

  it("prepends the default sign only when unsigned", () => {
    expect(formatAmountString("12", "-")).toBe("-12");
    expect(formatAmountString("12", "+")).toBe("+12");
    expect(formatAmountString("+12", "-")).toBe("+12");
  });

  it("converts commas to dots", () => {
    expect(formatAmountString("3,5", "+")).toBe("+3.5");
  });

  it("strips letters and other disallowed characters", () => {
    expect(formatAmountString("1a2b", "-")).toBe("-12");
    expect(formatAmountString("€5 ", "-")).toBe("-5");
  });

  it("keeps only the first dot and at most two decimals", () => {
    expect(formatAmountString("1.2.3", "-")).toBe("-1.23");
    expect(formatAmountString("1.23456", "-")).toBe("-1.23");
    expect(formatAmountString("7.", "-")).toBe("-7.");
  });

  it("wraps formulas after the sign without clamping decimals", () => {
    expect(formatAmountString("1.234+2", "-")).toBe("-(1.234+2");
    expect(formatAmountString("-(8+5", "-")).toBe("-(8+5");
    expect(formatAmountString("(2*3)", "+")).toBe("+(2*3)");
  });
});
