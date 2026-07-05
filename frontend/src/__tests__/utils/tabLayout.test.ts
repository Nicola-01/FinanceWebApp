import { describe, it, expect, beforeEach } from "vitest";
import {
  clearLayout,
  defaultLayout,
  hideSlot,
  mergeSlots,
  moveSlot,
  nextGroupId,
  popWidget,
  popWidgetTo,
  readLayout,
  reconcileLayout,
  reorderMember,
  setActiveWidget,
  showSlot,
  writeLayout,
  type LayoutWidgetMeta,
  type TabLayout,
} from "../../utils/tabLayout";

const WIDGETS: LayoutWidgetMeta[] = [
  { id: "a", span: "half" },
  { id: "b", span: "half" },
  { id: "c", span: "full" },
  { id: "d", span: "full" },
  { id: "h", span: "full", hiddenByDefault: true },
];

const single = (id: string) => ({ id, widgets: [id] });

describe("defaultLayout", () => {
  it("puts non-default-hidden widgets in slots, hiddenByDefault in hiddenSlots", () => {
    const l = defaultLayout(WIDGETS);
    expect(l.slots.map((s) => s.id)).toEqual(["a", "b", "c", "d"]);
    expect(l.hiddenSlots.map((s) => s.id)).toEqual(["h"]);
    expect(l.slots.every((s) => s.widgets.length === 1)).toBe(true);
  });
});

describe("reconcileLayout", () => {
  it("returns the default layout for garbage input", () => {
    expect(reconcileLayout(null, WIDGETS)).toEqual(defaultLayout(WIDGETS));
    expect(reconcileLayout("nope", WIDGETS)).toEqual(defaultLayout(WIDGETS));
    expect(reconcileLayout({ slots: 3 }, WIDGETS)).toEqual(
      defaultLayout(WIDGETS),
    );
  });

  it("drops widgets that are no longer registered and dissolves empty slots", () => {
    const stored: TabLayout = {
      slots: [single("gone"), { id: "group-1", widgets: ["a", "zombie"] }],
      hiddenSlots: [],
    };
    const l = reconcileLayout(stored, WIDGETS);
    // "gone"/"zombie" dropped; group-1 left with only "a" becomes standalone;
    // missing b/c/d appended visible, h appended hidden.
    expect(l.slots.map((s) => s.id)).toEqual(["a", "b", "c", "d"]);
    expect(l.hiddenSlots.map((s) => s.id)).toEqual(["h"]);
  });

  it("keeps a stored group intact and preserves its activeWidget", () => {
    const stored: TabLayout = {
      slots: [
        { id: "group-1", widgets: ["a", "b"], activeWidget: "b" },
        single("c"),
        single("d"),
      ],
      hiddenSlots: [single("h")],
    };
    const l = reconcileLayout(stored, WIDGETS);
    expect(l.slots[0]).toEqual({
      id: "group-1",
      widgets: ["a", "b"],
      activeWidget: "b",
    });
  });

  it("deduplicates a widget that appears in two slots (first wins)", () => {
    const stored: TabLayout = {
      slots: [single("a"), { id: "group-1", widgets: ["a", "b"] }],
      hiddenSlots: [],
    };
    const l = reconcileLayout(stored, WIDGETS);
    const ids = l.slots.flatMap((s) => s.widgets);
    expect(ids.filter((w) => w === "a")).toHaveLength(1);
    // group-1 keeps only "b" -> dissolves to standalone
    expect(l.slots.find((s) => s.widgets.includes("b"))?.id).toBe("b");
  });

  it("splits a mixed-span group: first member's span wins, others pop out standalone", () => {
    const stored: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "c", "b"] }],
      hiddenSlots: [],
    };
    const l = reconcileLayout(stored, WIDGETS);
    expect(l.slots[0]).toEqual({ id: "group-1", widgets: ["a", "b"] });
    expect(l.slots[1]).toEqual(single("c"));
  });

  it("keeps hidden groups intact in hiddenSlots", () => {
    const stored: TabLayout = {
      slots: [single("c"), single("d")],
      hiddenSlots: [{ id: "group-2", widgets: ["a", "b"] }],
    };
    const l = reconcileLayout(stored, WIDGETS);
    expect(l.hiddenSlots.map((s) => s.id)).toEqual(["group-2", "h"]);
  });

  it("deduplicates a widget repeated inside a single slot", () => {
    const l = reconcileLayout(
      {
        slots: [
          { id: "group-1", widgets: ["a", "a", "b"] },
          single("c"),
          single("d"),
        ],
        hiddenSlots: [],
      },
      WIDGETS,
    );
    expect(l.slots[0]).toEqual({ id: "group-1", widgets: ["a", "b"] });

    // A slot reduced to a single member by the dedupe dissolves to standalone.
    const dissolved = reconcileLayout(
      { slots: [{ id: "a", widgets: ["a", "a"] }], hiddenSlots: [] },
      WIDGETS,
    );
    expect(dissolved.slots[0]).toEqual(single("a"));
  });

  it("renames a duplicated group id so slot ids stay unique", () => {
    const l = reconcileLayout(
      {
        slots: [
          { id: "group-1", widgets: ["a", "b"] },
          { id: "group-1", widgets: ["c", "d"] },
        ],
        hiddenSlots: [],
      },
      WIDGETS,
    );
    const ids = l.slots.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(l.slots[0]).toEqual({ id: "group-1", widgets: ["a", "b"] });
    expect(l.slots[1].widgets).toEqual(["c", "d"]);
    expect(l.slots[1].id).toMatch(/^group-\d+$/);
    expect(l.slots[1].id).not.toBe("group-1");
  });

  it("renames group ids that do not follow the group-<n> pattern", () => {
    // A group id colliding with a widget id would break keys/dnd ids.
    const l = reconcileLayout(
      { slots: [{ id: "a", widgets: ["c", "d"] }], hiddenSlots: [] },
      WIDGETS,
    );
    expect(l.slots[0].id).toMatch(/^group-\d+$/);
    expect(l.slots[0].widgets).toEqual(["c", "d"]);
  });
});

describe("read/write/clear", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a layout per tab+wallet key", () => {
    const l = defaultLayout(WIDGETS);
    const moved = moveSlot(l, "d", "a");
    writeLayout("categories", "w1", moved);
    expect(readLayout("categories", "w1", WIDGETS)).toEqual(moved);
    // A different wallet still gets the default.
    expect(readLayout("categories", "w2", WIDGETS)).toEqual(l);
  });

  it("clearLayout removes the stored layout", () => {
    writeLayout("categories", "w1", defaultLayout(WIDGETS));
    clearLayout("categories", "w1");
    expect(localStorage.getItem("tab_layout_categories_w1")).toBeNull();
  });

  it("falls back to default on unparsable JSON", () => {
    localStorage.setItem("tab_layout_categories_w1", "{broken");
    expect(readLayout("categories", "w1", WIDGETS)).toEqual(
      defaultLayout(WIDGETS),
    );
  });
});

describe("moveSlot", () => {
  it("moves the active slot to the over slot's position", () => {
    const l = defaultLayout(WIDGETS);
    expect(moveSlot(l, "d", "a").slots.map((s) => s.id)).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
    expect(moveSlot(l, "a", "c").slots.map((s) => s.id)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("is a no-op for unknown ids or self-drop", () => {
    const l = defaultLayout(WIDGETS);
    expect(moveSlot(l, "nope", "a")).toBe(l);
    expect(moveSlot(l, "a", "a")).toBe(l);
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

describe("popWidget", () => {
  it("pops a widget out right after the group; 2-member groups dissolve", () => {
    const l: TabLayout = {
      slots: [
        { id: "group-1", widgets: ["a", "b"], activeWidget: "b" },
        single("c"),
      ],
      hiddenSlots: [],
    };
    const popped = popWidget(l, "group-1", "b");
    expect(popped.slots.map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(popped.slots[0]).toEqual(single("a"));
  });

  it("keeps 3-member groups alive and fixes activeWidget", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["c", "d", "h"], activeWidget: "d" }],
      hiddenSlots: [],
    };
    const popped = popWidget(l, "group-1", "d");
    expect(popped.slots[0]).toEqual({
      id: "group-1",
      widgets: ["c", "h"],
      activeWidget: "c",
    });
    expect(popped.slots[1]).toEqual(single("d"));
  });

  it("is a no-op on standalone slots or missing members", () => {
    const l = defaultLayout(WIDGETS);
    expect(popWidget(l, "a", "a")).toBe(l);
    expect(popWidget(l, "group-9", "a")).toBe(l);
  });

  it("never commits an empty slot when a corrupt group repeats the popped widget", () => {
    const l: TabLayout = {
      slots: [{ id: "group-1", widgets: ["a", "a"] }],
      hiddenSlots: [],
    };
    expect(popWidget(l, "group-1", "a")).toBe(l);
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
