import { describe, it, expect } from "vitest";
import {
  getPasswordRequirements,
  isPasswordValid,
} from "./passwordRequirements";

/** Looks up a single requirement's pass/fail state by its label prefix. */
const passes = (
  password: string,
  labelPart: string,
  confirm?: string,
): boolean => {
  const req = getPasswordRequirements(password, confirm).find((r) =>
    r.label.includes(labelPart),
  );
  if (!req) throw new Error(`Requirement matching "${labelPart}" not found`);
  return req.test();
};

describe("getPasswordRequirements", () => {
  describe("length rule (>= 8)", () => {
    it("fails at 7 characters", () => {
      expect(passes("Aa1!aaa", "At least 8")).toBe(false);
    });
    it("passes at exactly 8 characters", () => {
      expect(passes("Aa1!aaaa", "At least 8")).toBe(true);
    });
  });

  describe("character-class rules", () => {
    it("requires a lowercase letter", () => {
      expect(passes("ABC12345", "lowercase")).toBe(false);
      expect(passes("aBC12345", "lowercase")).toBe(true);
    });
    it("requires an uppercase letter", () => {
      expect(passes("abc12345", "uppercase")).toBe(false);
      expect(passes("Abc12345", "uppercase")).toBe(true);
    });
    it("requires a number", () => {
      expect(passes("Abcdefgh", "number")).toBe(false);
      expect(passes("Abcdefg1", "number")).toBe(true);
    });
    it("requires a special symbol", () => {
      expect(passes("Abcdefg1", "special")).toBe(false);
      expect(passes("Abcdefg1!", "special")).toBe(true);
    });
  });

  describe("passwords-match rule", () => {
    it("passes when confirmPassword is undefined", () => {
      expect(passes("Secret1!", "match")).toBe(true);
    });
    it("passes when both match and are non-empty", () => {
      expect(passes("Secret1!", "match", "Secret1!")).toBe(true);
    });
    it("fails when they differ", () => {
      expect(passes("Secret1!", "match", "Other1!")).toBe(false);
    });
    it("fails when both are empty", () => {
      expect(passes("", "match", "")).toBe(false);
    });
  });
});

describe("isPasswordValid", () => {
  it("is true only when every rule passes", () => {
    expect(isPasswordValid("Secret1!", "Secret1!")).toBe(true);
  });
  it("is false when a single rule fails (no symbol)", () => {
    expect(isPasswordValid("Secret12", "Secret12")).toBe(false);
  });
  it("is false when confirmation mismatches", () => {
    expect(isPasswordValid("Secret1!", "Secret1?")).toBe(false);
  });

  describe("SECURITY: rejects common weak passwords", () => {
    it.each(["password", "12345678", "aaaaaaaa", "PASSWORD"])(
      "rejects %j",
      (weak) => {
        expect(isPasswordValid(weak, weak)).toBe(false);
      },
    );
  });
});
