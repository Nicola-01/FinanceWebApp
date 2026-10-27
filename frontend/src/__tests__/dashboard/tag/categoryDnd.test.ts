import { describe, it, expect } from "vitest";
import type { Tag } from "../../../types/domain";
import type { TagTreeNode } from "../../../utils/tagOrder";
import {
  CONTAINER_PREFIX,
  buildChildParent,
  moveChildToParent,
  resolveTargetParent,
} from "../../../dashboard/tag/categoryDnd";

const tag = (name: string, parentName: string | null = null): Tag => ({
  name,
  icon: "tag",
  colorHex: "#8b5cf6",
  parentName,
});

const tree: TagTreeNode[] = [
  {
    parent: tag("Food"),
    children: [tag("Pizza", "Food"), tag("Sushi", "Food")],
  },
  { parent: tag("Home"), children: [tag("Rent", "Home")] },
  { parent: tag("Empty"), children: [] },
];

describe("buildChildParent", () => {
  it("maps every child to its parent", () => {
    expect(buildChildParent(tree)).toEqual({
      Pizza: "Food",
      Sushi: "Food",
      Rent: "Home",
    });
  });
});

describe("resolveTargetParent", () => {
  const roots = new Set(["Food", "Home", "Empty"]);
  const cp = buildChildParent(tree);

  it("resolves a container id to its parent", () => {
    expect(resolveTargetParent(`${CONTAINER_PREFIX}Empty`, roots, cp)).toBe(
      "Empty",
    );
  });
  it("resolves a parent id to itself", () => {
    expect(resolveTargetParent("Home", roots, cp)).toBe("Home");
  });
  it("resolves a child id to its parent", () => {
    expect(resolveTargetParent("Sushi", roots, cp)).toBe("Food");
  });
  it("returns null for an unknown id", () => {
    expect(resolveTargetParent("Nope", roots, cp)).toBeNull();
  });
});

describe("moveChildToParent", () => {
  it("moves a child into another parent at the given index", () => {
    const next = moveChildToParent(tree, "Pizza", "Food", "Home", 0);
    expect(next[0].children.map((c) => c.name)).toEqual(["Sushi"]);
    expect(next[1].children.map((c) => c.name)).toEqual(["Pizza", "Rent"]);
    expect(next[1].children[0].parentName).toBe("Home");
    expect(next[2]).toBe(tree[2]);
  });
  it("appends into an empty parent", () => {
    const next = moveChildToParent(tree, "Rent", "Home", "Empty", 0);
    expect(next[1].children).toEqual([]);
    expect(next[2].children.map((c) => c.name)).toEqual(["Rent"]);
  });
  it("returns the same tree when parent or child is missing", () => {
    expect(moveChildToParent(tree, "Pizza", "Food", "Nope", 0)).toBe(tree);
    expect(moveChildToParent(tree, "Nope", "Food", "Home", 0)).toBe(tree);
  });
});
