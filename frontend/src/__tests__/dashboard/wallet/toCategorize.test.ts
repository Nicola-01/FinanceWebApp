import { describe, expect, it } from "vitest";
import {
  isCategorised,
  selectToCategorize,
  suggestTagName,
} from "../../../dashboard/wallet/toCategorize";
import type { Transaction } from "../../../types/domain";

const tx = (id: string, date: string, needsReview?: boolean) =>
  ({ id, transactionDate: date, needsReview }) as Transaction;

describe("selectToCategorize", () => {
  it("keeps only needsReview, newest first", () => {
    const out = selectToCategorize([
      tx("a", "2026-01-01", true),
      tx("b", "2026-03-01", false),
      tx("c", "2026-02-01", true),
      tx("d", "2026-04-01"),
    ]);
    expect(out.map((t) => t.id)).toEqual(["c", "a"]);
  });
});

describe("isCategorised", () => {
  it("is false only for imports still on the placeholder", () => {
    expect(isCategorised({ needsReview: true } as Transaction)).toBe(false);
    expect(isCategorised({ needsReview: false } as Transaction)).toBe(true);
    expect(isCategorised({} as Transaction)).toBe(true);
  });
});

describe("suggestTagName", () => {
  const t = (
    id: string,
    name: string,
    tag: string,
    date: string,
    needsReview = false,
  ) =>
    ({
      id,
      name,
      tag: { name: tag },
      transactionDate: date,
      needsReview,
    }) as Transaction;
  const imp = t("i", " openai ", "To categorise", "2026-06-01", true);

  it("uses the newest categorised same-name transaction, ignoring case and spaces", () => {
    expect(
      suggestTagName(imp, [
        imp,
        t("a", "OpenAI", "Work", "2026-01-01"),
        t("b", "OpenAI", "AI", "2026-03-01"),
        t("c", "OpenAI", "To categorise", "2026-05-01", true),
        t("d", "Other", "Food", "2026-04-01"),
      ]),
    ).toBe("AI");
  });

  it("is empty when nothing matches", () => {
    expect(
      suggestTagName(imp, [imp, t("d", "Other", "Food", "2026-04-01")]),
    ).toBe("");
  });
});
