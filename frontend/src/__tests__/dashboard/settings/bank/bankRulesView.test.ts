import { describe, it, expect } from "vitest";
import type { BankRule, Tag } from "../../../../types/domain";
import {
  filterRules,
  groupRules,
  shouldGroup,
} from "../../../../dashboard/settings/bank/bankRulesView";

const tag = (name: string) =>
  ({ name, icon: "tag", colorHex: "#000000" }) as Tag;
const rule = (id: string, name: string, matchText: string, tagName?: string) =>
  ({
    id,
    name,
    matchText,
    tag: tagName ? tag(tagName) : null,
    usedBy: [],
    transactionCount: 0,
  }) as BankRule;

const rules = [
  rule("1", "Netflix", "NETFLIX.COM", "Streaming"),
  rule("2", "Zurich", "ZURICH", "Pension"),
  rule("3", "Rename only", "UNIPOL"),
  rule("4", "Spotify", "SPOTIFY", "Streaming"),
  rule("5", "Amazon", "AMZN", "Shopping"),
];

describe("filterRules", () => {
  it("returns everything for a blank query", () => {
    expect(filterRules(rules, "  ")).toHaveLength(5);
  });

  it("matches name, bank text and category, case-insensitively", () => {
    expect(filterRules(rules, "zURich").map((r) => r.id)).toEqual(["2"]);
    expect(filterRules(rules, "amzn").map((r) => r.id)).toEqual(["5"]);
    expect(filterRules(rules, "streaming").map((r) => r.id)).toEqual([
      "1",
      "4",
    ]);
  });

  it("returns nothing when no field matches", () => {
    expect(filterRules(rules, "xyz")).toEqual([]);
  });
});

describe("groupRules", () => {
  it("orders groups by category name and puts uncategorised rules last", () => {
    const groups = groupRules(rules);
    expect(groups.map((g) => g.tag?.name ?? null)).toEqual([
      "Pension",
      "Shopping",
      "Streaming",
      null,
    ]);
  });

  it("keeps the rules of one category together in input order", () => {
    const streaming = groupRules(rules).find(
      (g) => g.tag?.name === "Streaming",
    );
    expect(streaming?.rules.map((r) => r.id)).toEqual(["1", "4"]);
  });

  it("omits the uncategorised group when every rule has a category", () => {
    const groups = groupRules(rules.filter((r) => r.tag));
    expect(groups.every((g) => g.tag !== null)).toBe(true);
  });
});

describe("shouldGroup", () => {
  it("groups only past 15 rules and never while searching", () => {
    expect(shouldGroup(15, "")).toBe(false);
    expect(shouldGroup(16, "")).toBe(true);
    expect(shouldGroup(16, "net")).toBe(false);
  });
});
