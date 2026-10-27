import { describe, it, expect } from "vitest";
import {
  hideSlot,
  mergeSlots,
  moveSlotToIndex,
  nextGroupId,
  popWidgetTo,
  reorderMember,
  setActiveWidget,
  showSlot,
} from "../../../utils/tabLayout/mutations";
import { defaultLayout } from "../../../utils/tabLayout/storage";
import type {
  LayoutWidgetMeta,
  TabLayout,
} from "../../../utils/tabLayout/types";

const WIDGETS: LayoutWidgetMeta[] = [
  { id: "a", span: "half" },
  { id: "b", span: "half" },
  { id: "c", span: "full" },
  { id: "d", span: "full" },
  { id: "h", span: "full", hiddenByDefault: true },
];

const single = (id: string) => ({ id, widgets: [id] });

describe("moveSlotToIndex", () => {
  // defaultLayout(WIDGETS) → visible slots [a, b, c, d].
  it("inserts the active slot at an index of the list WITHOUT it", () => {
    const l = defaultLayout(WIDGETS);
    expect(moveSlotToIndex(l, "d", 0).slots.map((s) => s.id)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
    expect(moveSlotToIndex(l, "a", 2).slots.map((s) => s.id)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("clamps out-of-range indices to the ends", () => {
    const l = defaultLayout(WIDGETS);
    expect(moveSlotToIndex(l, "a", 99).slots.map((s) => s.id)).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
    expect(moveSlotToIndex(l, "d", -5).slots.map((s) => s.id)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
  });

  it("is a no-op (same reference) when it lands back in place or the id is unknown", () => {
    const l = defaultLayout(WIDGETS);
    expect(moveSlotToIndex(l, "a", 0)).toBe(l);
    expect(moveSlotToIndex(l, "b", 1)).toBe(l);
    expect(moveSlotToIndex(l, "nope", 0)).toBe(l);
  });
});

describe("nextGroupId", () => {
  it("returns group-1 when no groups exist and max+1 otherwise", () => {
    const l = defaultLayout(WIDGETS);
    expect(nextGroupId(l)).toBe("group-1");
    const withGroups: TabLayout = {
      slots: [{ id: "group-3", widgets: ["a", "b"] }],
      hiddenSlots: [{ id: "group-7", widgets: ["c", "d"] }],
    };
    expect(nextGroupId(withGroups)).toBe("group-8");
  });
});

describe("mergeSlots", () => {
  it("merges two same-span standalone slots into a new group at the target position", () => {
    const l = defaultLayout(WIDGETS);
    const merged = mergeSlots(l, "a", "b", WIDGETS);
    expect(merged.slots.map((s) => s.id)).toEqual(["group-1", "c", "d"]);
    expect(merged.slots[0].widgets).toEqual(["b", "a"]);
    // The freshly added widget becomes the active tab.
    expect(merged.slots[0].activeWidget).toBe("a");
  });

  it("merging into an existing group keeps its id and appends", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["c", "d"] }, single("a"), single("b")],
      hiddenSlots: [],
    };
    // b (half) cannot join a full group…
    expect(mergeSlots(l, "b", "group-1", WIDGETS)).toBe(l);
    // …but merging full onto full works and group-onto-group concatenates.
    const twoGroups: TabLayout = {
      slots: [
        { id: "group-1", widgets: ["c", "d"] },
        { id: "group-2", widgets: ["h"] },
      ],
      hiddenSlots: [],
    };
    // no nesting: group-2's widgets are absorbed and the target keeps its id
    const merged = mergeSlots(twoGroups, "group-2", "group-1", WIDGETS);
    expect(merged.slots.map((s) => s.id)).toEqual(["group-1"]);
    expect(merged.slots[0].widgets).toEqual(["c", "d", "h"]);
    expect(merged.slots[0].activeWidget).toBe("h");
  });

  it("rejects span mismatches and unknown slots", () => {
    const l = defaultLayout(WIDGETS);
    expect(mergeSlots(l, "a", "c", WIDGETS)).toBe(l); // half onto full
    expect(mergeSlots(l, "a", "a", WIDGETS)).toBe(l); // self
    expect(mergeSlots(l, "nope", "a", WIDGETS)).toBe(l);
  });
});

describe("reorderMember", () => {
  it("moves a member within a group to the target member's position", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b", "c"], activeWidget: "b" }],
      hiddenSlots: [],
    };
    // a -> c: remove a, insert at c's index -> [b, c, a]
    expect(reorderMember(l, "group-1", "a", "c").slots[0].widgets).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("preserves activeWidget", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b", "c"], activeWidget: "b" }],
      hiddenSlots: [],
    };
    expect(reorderMember(l, "group-1", "a", "c").slots[0].activeWidget).toBe(
      "b",
    );
  });

  it("is a no-op on a standalone slot", () => {
    const l = defaultLayout(WIDGETS);
    expect(reorderMember(l, "a", "a", "b")).toBe(l);
  });

  it("is a no-op when either member is not part of the group", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b"] }],
      hiddenSlots: [],
    };
    expect(reorderMember(l, "group-1", "a", "z")).toBe(l);
    expect(reorderMember(l, "group-1", "z", "a")).toBe(l);
  });

  it("is a no-op when from === to", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b"] }],
      hiddenSlots: [],
    };
    expect(reorderMember(l, "group-1", "a", "a")).toBe(l);
  });
});

describe("popWidgetTo", () => {
  it("pops a member out of a group into a standalone slot at the given index", () => {
    const l: TabLayout = {
      slots: [
        { id: "group-1", widgets: ["a", "b", "c"], activeWidget: "a" },
        single("d"),
      ],
      hiddenSlots: [],
    };
    const popped = popWidgetTo(l, "group-1", "b", 1);
    expect(popped.slots.map((s) => s.id)).toEqual(["group-1", "b", "d"]);
    expect(popped.slots[0]).toEqual({
      id: "group-1",
      widgets: ["a", "c"],
      activeWidget: "a",
    });
    expect(popped.slots[1]).toEqual(single("b"));
  });

  it("dissolves a 2-member group and frees the member at the index", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b"] }, single("c")],
      hiddenSlots: [],
    };
    const popped = popWidgetTo(l, "group-1", "b", 2);
    expect(popped.slots.map((s) => s.id)).toEqual(["a", "c", "b"]);
    expect(popped.slots[0]).toEqual(single("a"));
    expect(popped.slots[2]).toEqual(single("b"));
  });

  it("heals activeWidget when the popped member was active", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b", "c"], activeWidget: "b" }],
      hiddenSlots: [],
    };
    const popped = popWidgetTo(l, "group-1", "b", 0);
    expect(popped.slots[0]).toEqual(single("b"));
    expect(popped.slots.find((s) => s.id === "group-1")).toEqual({
      id: "group-1",
      widgets: ["a", "c"],
      activeWidget: "a",
    });
  });

  it("clamps atIndex to the slot list bounds", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b", "c"] }, single("d")],
      hiddenSlots: [],
    };
    expect(popWidgetTo(l, "group-1", "b", 99).slots.map((s) => s.id)).toEqual([
      "group-1",
      "d",
      "b",
    ]);
    expect(popWidgetTo(l, "group-1", "b", -5).slots.map((s) => s.id)).toEqual([
      "b",
      "group-1",
      "d",
    ]);
  });

  it("is a no-op on a standalone slot or a missing member", () => {
    const l = defaultLayout(WIDGETS);
    expect(popWidgetTo(l, "a", "a", 0)).toBe(l);
    const g: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b"] }],
      hiddenSlots: [],
    };
    expect(popWidgetTo(g, "group-1", "z", 0)).toBe(g);
    expect(popWidgetTo(g, "group-9", "a", 0)).toBe(g);
  });
});

describe("hide/show", () => {
  it("hides a slot as one unit and restores it at the end", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b"] }, single("c"), single("d")],
      hiddenSlots: [single("h")],
    };
    const hidden = hideSlot(l, "group-1");
    expect(hidden.slots.map((s) => s.id)).toEqual(["c", "d"]);
    expect(hidden.hiddenSlots.map((s) => s.id)).toEqual(["h", "group-1"]);

    const restored = showSlot(hidden, "group-1");
    expect(restored.slots.map((s) => s.id)).toEqual(["c", "d", "group-1"]);
    expect(restored.slots[2].widgets).toEqual(["a", "b"]);
  });

  it("is a no-op for unknown ids", () => {
    const l = defaultLayout(WIDGETS);
    expect(hideSlot(l, "nope")).toBe(l);
    expect(showSlot(l, "nope")).toBe(l);
  });
});

describe("setActiveWidget", () => {
  it("sets the active tab of a group, ignoring foreign widgets", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "b"] }],
      hiddenSlots: [],
    };
    expect(setActiveWidget(l, "group-1", "b").slots[0].activeWidget).toBe("b");
    expect(setActiveWidget(l, "group-1", "c").slots[0].activeWidget).toBe(
      undefined,
    );
  });
});
