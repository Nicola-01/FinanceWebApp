import { describe, it, expect } from "vitest";
import { evaluateMathExpression } from "../../utils/mathEvaluator";

describe("evaluateMathExpression", () => {
  describe("valid arithmetic", () => {
    it.each([
      ["1+1", 2],
      ["2*3", 6],
      ["10-3-2", 5],
      ["(2+3)*4", 20],
      [".5+.5", 1],
      ["8/2", 4],
      [" 1 + 1 ", 2],
      ["-5+10", 5],
      ["2*-3", -6],
    ])("evaluates %j to %d", (expr, expected) => {
      expect(evaluateMathExpression(expr)).toBe(expected);
    });
  });

  describe("percentages", () => {
    it.each([
      ["100%", 1],
      ["50%*2", 1],
      ["20%+1", 1.2],
    ])("converts %j to %d", (expr, expected) => {
      expect(evaluateMathExpression(expr)).toBeCloseTo(expected, 10);
    });
  });

  describe("numeric edge cases", () => {
    it("returns null for division by zero (Infinity)", () => {
      expect(evaluateMathExpression("1/0")).toBeNull();
    });
    it("returns null for 0/0 (NaN)", () => {
      expect(evaluateMathExpression("0/0")).toBeNull();
    });
    it("returns null for an empty string", () => {
      expect(evaluateMathExpression("")).toBeNull();
    });
    it("returns null for whitespace only", () => {
      expect(evaluateMathExpression("   ")).toBeNull();
    });
  });

  describe("SECURITY: rejects any non-arithmetic input", () => {
    it.each([
      "alert(1)",
      "window",
      "process.exit()",
      "[].constructor",
      "1;2",
      "1,2",
      "`x`",
      "'a'",
      '"a"',
      "1==1",
      "a=1",
      "\\",
      "1&&1",
      "1|1",
      "0x10", // hex 'x' is a letter
      "Math.random()",
      "globalThis",
      "eval('1')",
    ])("returns null for malicious input %j", (expr) => {
      expect(evaluateMathExpression(expr)).toBeNull();
    });

    it("never throws on hostile input", () => {
      expect(() => evaluateMathExpression("}{)(][")).not.toThrow();
      expect(evaluateMathExpression("}{)(][")).toBeNull();
    });
  });
});
