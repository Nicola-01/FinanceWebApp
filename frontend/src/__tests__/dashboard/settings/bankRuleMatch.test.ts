import { describe, it, expect } from "vitest";
import {
  bankNameOf,
  ruleMatches,
  suggestMatchText,
  suggestRuleName,
} from "../../../dashboard/settings/bankRuleMatch";
import type { Transaction } from "../../../types/domain";

const rule = (matchText: string, regex = false, ignoreCase = true) => ({
  matchText,
  regex,
  ignoreCase,
});

describe("ruleMatches", () => {
  it("never matches a blank text", () => {
    expect(ruleMatches(rule("  "), "ANYTHING")).toBe(false);
    expect(ruleMatches(rule(""), "")).toBe(false);
  });

  it("matches plain text as a case-insensitive contains by default", () => {
    expect(ruleMatches(rule("amzn"), "AMZN Mktp IT")).toBe(true);
    expect(ruleMatches(rule("netflix"), "Spotify")).toBe(false);
  });

  it("matches case-sensitively when ignoreCase is off", () => {
    expect(ruleMatches(rule("amzn", false, false), "AMZN")).toBe(false);
    expect(ruleMatches(rule("AMZN", false, false), "AMZN")).toBe(true);
  });

  it("trims the saved text before matching", () => {
    expect(ruleMatches(rule("  AMZN "), "AMZN Mktp")).toBe(true);
  });

  it("treats a regex as a find, not a full match", () => {
    expect(ruleMatches(rule("^AMZ", true), "AMZN Mktp")).toBe(true);
    expect(ruleMatches(rule("MKTP$", true, false), "AMZN Mktp")).toBe(false);
    expect(ruleMatches(rule("mktp$", true), "AMZN Mktp")).toBe(true);
  });

  it("honours ignoreCase for regexes", () => {
    expect(ruleMatches(rule("amzn\\s", true, true), "AMZN MKTP")).toBe(true);
    expect(ruleMatches(rule("amzn\\s", true, false), "AMZN MKTP")).toBe(false);
  });

  it("returns false for an invalid regex instead of throwing", () => {
    expect(ruleMatches(rule("(", true), "(")).toBe(false);
  });
});

describe("bankNameOf", () => {
  const tx = (name: string, notes?: string) => ({ name, notes }) as Transaction;

  it("uses the transaction name when there is no bank note", () => {
    expect(bankNameOf(tx("Coffee", undefined))).toBe("Coffee");
    expect(bankNameOf(tx("Coffee", "Recurring: Food (#2)"))).toBe("Coffee");
  });

  it("reads the bank name from a 'Bank: X' note", () => {
    expect(bankNameOf(tx("Renamed", "Bank: UNIPOLMOVE"))).toBe("UNIPOLMOVE");
  });

  it("stops at the first '; ' of a 'Bank: X; other note' note", () => {
    expect(
      bankNameOf(tx("Renamed", "Bank: UNIPOLMOVE; Recurring: Car (#3)")),
    ).toBe("UNIPOLMOVE");
  });
});

describe("suggestMatchText", () => {
  it("picks the longest letters-only word", () => {
    expect(suggestMatchText("AMZN Mktp IT Unipol")).toBe("Unipol");
  });

  it("skips words with digits or punctuation", () => {
    expect(suggestMatchText("PAYPAL*SPOTIFY 123")).toBe("SPOTIFY");
  });

  it("keeps the first of equally long words", () => {
    expect(suggestMatchText("ALPHA BRAVO")).toBe("ALPHA");
  });

  it("uses Unicode letters", () => {
    expect(suggestMatchText("CAFÉ-ÉLÉGANT 9")).toBe("ÉLÉGANT");
  });

  it("falls back to the trimmed full name when no word has 3 letters", () => {
    expect(suggestMatchText("  A1 B2  ")).toBe("A1 B2");
  });
});

describe("suggestRuleName", () => {
  it("title-cases the suggested token", () => {
    expect(suggestRuleName("UNIPOLMOVE")).toBe("Unipolmove");
  });

  it("title-cases each word of the fallback name", () => {
    expect(suggestRuleName("a1 b2")).toBe("A1 B2");
  });
});
