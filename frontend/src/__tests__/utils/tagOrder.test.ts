import { describe, it, expect, beforeEach } from "vitest";
import type { Tag } from "../../utils/types";
import { applyTagOrder, persistTree } from "../../utils/tagOrder";

const t = (name: string, parentName: string | null = null): Tag => ({
  name,
  icon: "tag",
  colorHex: "#ffffff",
  parentName,
});

const KEY = (w: string) => `tag_order_${w}`;

describe("applyTagOrder", () => {
  beforeEach(() => localStorage.clear());

  it("groups roots + children in fetch order when nothing is saved", () => {
    const tags = [
      t("Food"),
      t("Home"),
      t("Utilities", "Home"),
      t("Groceries", "Food"),
    ];
    const tree = applyTagOrder("w1", tags);

    expect(tree.map((n) => n.parent.name)).toEqual(["Food", "Home"]);
    expect(
      tree.find((n) => n.parent.name === "Home")!.children.map((c) => c.name),
    ).toEqual(["Utilities"]);
    expect(
      tree.find((n) => n.parent.name === "Food")!.children.map((c) => c.name),
    ).toEqual(["Groceries"]);
  });

  it("respects the saved root + child order, pushing unknown names last", () => {
    localStorage.setItem(
      KEY("w1"),
      JSON.stringify({
        roots: ["Home", "Food"],
        children: { Home: ["Rent", "Utilities"] },
      }),
    );
    const tags = [
      t("Food"),
      t("Home"),
      t("Utilities", "Home"),
      t("Rent", "Home"),
      t("Water", "Home"), // not in saved order -> last
    ];
    const tree = applyTagOrder("w1", tags);

    expect(tree.map((n) => n.parent.name)).toEqual(["Home", "Food"]);
    expect(
      tree.find((n) => n.parent.name === "Home")!.children.map((c) => c.name),
    ).toEqual(["Rent", "Utilities", "Water"]);
  });

  it("promotes orphan children (missing parent) to roots so nothing hides", () => {
    const tags = [t("Food"), t("Ghost", "DoesNotExist")];
    const tree = applyTagOrder("w1", tags);
    expect(tree.map((n) => n.parent.name).sort()).toEqual(["Food", "Ghost"]);
  });
});

describe("persistTree", () => {
  beforeEach(() => localStorage.clear());

  it("writes roots + per-parent child names from the tree", () => {
    const tree = applyTagOrder("w1", [t("A"), t("B"), t("A1", "A")]);
    persistTree("w1", tree);
    const stored = JSON.parse(localStorage.getItem(KEY("w1"))!);
    expect(stored.roots).toEqual(["A", "B"]);
    expect(stored.children.A).toEqual(["A1"]);
  });

  it("self-heals: a deleted tag drops out on the next apply + persist", () => {
    localStorage.setItem(
      KEY("w1"),
      JSON.stringify({ roots: ["A", "B"], children: { A: ["A1", "A2"] } }),
    );
    // A2 was deleted on the backend and is no longer in the tag list.
    const tree = applyTagOrder("w1", [t("A"), t("B"), t("A1", "A")]);
    persistTree("w1", tree);
    const stored = JSON.parse(localStorage.getItem(KEY("w1"))!);
    expect(stored.children.A).toEqual(["A1"]);
  });

  it("reparent: a child moved under a new parent is reflected after persist", () => {
    persistTree("w1", applyTagOrder("w1", [t("A"), t("B"), t("A1", "A")]));
    // After updateTag flips A1.parentName from A to B:
    const tree = applyTagOrder("w1", [t("A"), t("B"), t("A1", "B")]);
    persistTree("w1", tree);
    const stored = JSON.parse(localStorage.getItem(KEY("w1"))!);
    expect(stored.children.A ?? []).toEqual([]);
    expect(stored.children.B).toEqual(["A1"]);
  });
});
