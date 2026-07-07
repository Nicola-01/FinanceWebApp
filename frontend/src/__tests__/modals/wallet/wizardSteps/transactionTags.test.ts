import { describe, it, expect } from "vitest";
import {
  transactionTagUnresolved,
  missingTransactionTagCount,
  groupMissingTransactionTags,
  reassignTransactionTag,
  removeTransactionsWithTag,
} from "../../../../modals/wallet/wizardSteps/transactionTags";
import type {
  TransactionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

const tx = (tag: string): TransactionRequest =>
  ({ name: "T", tag }) as TransactionRequest;

const tag = (name: string): TagRequest => ({
  name,
  icon: "tag",
  colorHex: "#000",
});

describe("transactionTagUnresolved", () => {
  it("is true when the tag isn't among the staged tags", () => {
    expect(transactionTagUnresolved(tx("Groceries"), [tag("Rent")])).toBe(true);
  });

  it("matches tag names case-insensitively and trimmed", () => {
    expect(
      transactionTagUnresolved(tx("  groceries "), [tag("Groceries")]),
    ).toBe(false);
  });

  it("treats an empty (or missing) tag as uncategorised, not unresolved", () => {
    expect(transactionTagUnresolved(tx(""), [])).toBe(false);
    expect(
      transactionTagUnresolved({ name: "T" } as TransactionRequest, []),
    ).toBe(false);
  });
});

describe("missingTransactionTagCount", () => {
  it("counts the distinct missing tags, not the transactions", () => {
    const txs = [tx("Groceries"), tx("groceries"), tx("Fuel"), tx("Rent")];
    // "Groceries"/"groceries" collapse to one; "Fuel" is the other missing one.
    expect(missingTransactionTagCount(txs, [tag("Rent")])).toBe(2);
  });

  it("ignores empty tags and tags that resolve", () => {
    const txs = [tx("Rent"), tx(""), tx("Groceries")];
    expect(
      missingTransactionTagCount(txs, [tag("Rent"), tag("Groceries")]),
    ).toBe(0);
  });

  it("is 0 for an empty list", () => {
    expect(missingTransactionTagCount([], [])).toBe(0);
  });
});

describe("groupMissingTransactionTags", () => {
  it("groups distinct missing tags, keeps first-seen casing, and counts rows", () => {
    const txs = [tx("Groceries"), tx("groceries"), tx("Fuel"), tx("Rent")];
    const groups = groupMissingTransactionTags(txs, [tag("Rent")]);

    expect(groups).toEqual([
      { name: "Groceries", key: "groceries", count: 2 },
      { name: "Fuel", key: "fuel", count: 1 },
    ]);
  });

  it("excludes empty and resolved tags", () => {
    const txs = [tx("Rent"), tx(""), tx("Groceries")];
    expect(
      groupMissingTransactionTags(txs, [tag("Rent"), tag("Groceries")]),
    ).toEqual([]);
  });
});

describe("reassignTransactionTag", () => {
  it("re-tags only the case-insensitive matches, leaving others untouched", () => {
    const txs = [tx("Groceries"), tx("groceries"), tx("Fuel")];
    expect(reassignTransactionTag(txs, "groceries", "Food")).toEqual([
      { name: "T", tag: "Food" },
      { name: "T", tag: "Food" },
      { name: "T", tag: "Fuel" },
    ]);
  });
});

describe("removeTransactionsWithTag", () => {
  it("drops every case-insensitive match", () => {
    const txs = [tx("Groceries"), tx("groceries"), tx("Fuel")];
    expect(removeTransactionsWithTag(txs, "groceries")).toEqual([
      { name: "T", tag: "Fuel" },
    ]);
  });
});
