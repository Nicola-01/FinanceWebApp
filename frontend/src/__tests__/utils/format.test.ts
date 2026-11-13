import { describe, expect, it } from "vitest";
import { formatAmount, toSentenceCase } from "../../utils/format";

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

describe("formatAmount signed", () => {
  it("prefixes + for income and a typographic minus for expenses", () => {
    expect(formatAmount(12345.6, { signed: true })).toBe("+12.345,60");
    expect(formatAmount(-12.5, { signed: true })).toBe("−12,50");
  });

  it("leaves zero unsigned", () => {
    expect(formatAmount(0, { signed: true })).toBe("0,00");
    expect(formatAmount(0, { signed: true, zeroAsDash: true })).toBe("—");
  });
});

describe("toSentenceCase", () => {
  it("capitalises the first word and lowercases later Title-case words", () => {
    expect(toSentenceCase("Category Trend")).toBe("Category trend");
    expect(toSentenceCase("Top Expense Categories")).toBe(
      "Top expense categories",
    );
    expect(toSentenceCase("Cash Flow Overview")).toBe("Cash flow overview");
  });

  it("keeps acronyms and mixed-case words as written", () => {
    expect(toSentenceCase("Import CSV From MCP")).toBe("Import CSV from MCP");
    expect(toSentenceCase("Sync iPhone Data")).toBe("Sync iPhone data");
  });

  it("leaves already sentence-cased and empty titles alone", () => {
    expect(toSentenceCase("Monthly overview")).toBe("Monthly overview");
    expect(toSentenceCase("")).toBe("");
  });
});
