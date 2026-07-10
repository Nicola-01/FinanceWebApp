# Categories Widget-Grid (Customizable Layout) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user rearrange, hide/show, and group the Categories-tab charts via an edit mode, with the layout persisted per wallet in localStorage.

**Architecture:** A generic widget-grid core (pure layout model in `utils/tabLayout.ts`, a `useTabLayout` hook, and `WidgetGrid`/`WidgetSlot`/`HiddenTray` components in `dashboard/layout/`) driven by a per-tab widget registry. The Categories tab supplies a 7-widget registry (the existing 6 charts + the resurrected heatmap, hidden by default). Drag = reorder-in-flow with fixed spans (dnd-kit sortable + live state reorder + Framer Motion `layout` FLIP animations); dropping on a card's center merges same-span widgets into a group rendered with the existing `SwitchableCard`.

**Tech Stack:** React 19 + TS, Tailwind 4 (`app-*` tokens), dnd-kit (`@dnd-kit/core@6`, `@dnd-kit/sortable@10` — `@dnd-kit/modifiers` NOT installed), framer-motion, existing `SwitchableCard`/`Selector`/`Button` primitives, Vitest + Testing Library (jsdom).

## Global Constraints

- **Frontend only.** No backend changes; persistence is localStorage.
- **English only** for all UI copy and code comments.
- Use theme-aware **`app-*` colour tokens**; never legacy `theme-*`/`--color-*` (no `.dark` override). `Selector` options must pass `activeColorClass: "text-app-text"` (its default is broken legacy `theme-text-primary`).
- **Sober style** per `frontend/style.md`: no colored glows/halos, no wiggle animations; wallet colour (`wallet.color`) is the accent for interactive highlights (merge target ring, tray-chip hover), applied via inline styles (dynamic value).
- **Reuse shared primitives** (`Button` from `src/components/ui/`); don't hand-roll `<button>` for toolbar CTAs.
- **Do NOT restart or kill the Vite dev server** on :5173 — it is already running.
- **No git commits** — the user handles git themselves. End tasks at green verification instead of a commit step.
- Do not touch the MUI X watermark CSS hack.
- After each task: `npx eslint --fix <changed files>` then `npx tsc -b` from `frontend/`, and `npx vitest run` must stay green (56 pre-existing tests + new ones). All commands run from `frontend/`.
- Layout editing is a **local view preference** — available to every wallet role including VIEWER (no RBAC gating).

## Confirmed product spec (from grilling)

- Scope: Categories tab only, but the core is generic (registry + tabId keyed persistence).
- Widgets (7): `income-pie` (½), `expense-pie` (½), `income-ranking` (½), `expense-ranking` (½), `trend` (full), `heatmap` (full, **hidden by default** — resurrect the commented-out chart), `sankey` (full). `DateRangeBanner` + page header stay fixed.
- Reorder-in-flow only; spans are fixed per widget; grid = 1 col mobile / 2 cols `xl`, rows aligned (no masonry).
- Edit mode: "Edit Layout" button in the header; toolbar becomes `[Reset] [Done]`; whole card is the drag surface; per-card eye-slash hides; instant apply (every change persists immediately, Done just exits, Reset restores defaults).
- Hidden widgets: tray below the grid, visible only in edit mode; chips restore at the end of the grid; a hidden group restores intact.
- Grouping: drop-on-center merges (folder-style); **only same-span** slots can merge — mismatched cards simply don't expose a merge zone (drop falls through to reorder); group renders as `SwitchableCard` (tabs = members, header = active member's title/subtitle, members render **bare**); in edit mode member chips with × pop widgets out; last-one-standing dissolves the group; widget-onto-group joins, group-onto-group merges (no nesting).
- Persistence: `localStorage` key `tab_layout_categories_<walletId>`, self-healing like `tag_order`.

## File map

**Create**
- `frontend/src/utils/tabLayout.ts` — pure layout model: types, (de)serialization, reconcile, mutations.
- `frontend/src/utils/tabLayout.test.ts` — unit tests for the model.
- `frontend/src/dashboard/layout/widgetTypes.ts` — `WidgetDef<Ctx>` registry entry type.
- `frontend/src/dashboard/layout/useTabLayout.ts` — stateful hook: read/persist/reset + wallet-switch resync.
- `frontend/src/dashboard/layout/WidgetGrid.tsx` — DndContext + grid + DragOverlay ghost + tray wiring.
- `frontend/src/dashboard/layout/WidgetSlot.tsx` — one sortable slot (standalone card or SwitchableCard group) + edit overlay + merge zone.
- `frontend/src/dashboard/layout/HiddenTray.tsx` — hidden-widgets tray.
- `frontend/src/dashboard/layout/WidgetGrid.test.tsx` — integration tests with a dummy registry (no MUI).
- `frontend/src/dashboard/tag/categoriesWidgets.tsx` — the Categories registry (7 widgets).

**Modify**
- `frontend/src/dashboard/tag/CategoryCharts.tsx` — add `bare` prop to `TransactionPieChart`.
- `frontend/src/dashboard/tag/CategoryRanking.tsx` — add `bare` prop.
- `frontend/src/dashboard/tag/CategoryTrendChart.tsx` — add `bare` prop.
- `frontend/src/dashboard/tag/CategoryHeatmapChart.tsx` — add `bare` prop.
- `frontend/src/dashboard/statistics/CashFlowSankey.tsx` — add `bare` prop.
- `frontend/src/dashboard/tag/TagsTab.tsx` — replace hardcoded chart sections with `WidgetGrid`; add Edit Layout / Reset / Done toolbar.

---

### Task 1: Pure layout model (`tabLayout.ts`)

**Files:**
- Create: `frontend/src/utils/tabLayout.ts`
- Test: `frontend/src/utils/tabLayout.test.ts`

**Interfaces:**
- Consumes: nothing (pure module, localStorage only).
- Produces (used by Tasks 3–5):
  - `type WidgetSpan = "half" | "full"`
  - `interface LayoutWidgetMeta { id: string; span: WidgetSpan; hiddenByDefault?: boolean }`
  - `interface LayoutSlot { id: string; widgets: string[]; activeWidget?: string }`
  - `interface TabLayout { slots: LayoutSlot[]; hiddenSlots: LayoutSlot[] }`
  - `defaultLayout(widgets: LayoutWidgetMeta[]): TabLayout`
  - `reconcileLayout(stored: unknown, widgets: LayoutWidgetMeta[]): TabLayout`
  - `readLayout(tabId: string, walletId: string, widgets: LayoutWidgetMeta[]): TabLayout`
  - `writeLayout(tabId: string, walletId: string, layout: TabLayout): void`
  - `clearLayout(tabId: string, walletId: string): void`
  - `moveSlot(layout: TabLayout, activeId: string, overId: string): TabLayout`
  - `nextGroupId(layout: TabLayout): string`
  - `mergeSlots(layout: TabLayout, sourceId: string, targetId: string, widgets: LayoutWidgetMeta[]): TabLayout`
  - `popWidget(layout: TabLayout, slotId: string, widgetId: string): TabLayout`
  - `hideSlot(layout: TabLayout, slotId: string): TabLayout`
  - `showSlot(layout: TabLayout, slotId: string): TabLayout`
  - `setActiveWidget(layout: TabLayout, slotId: string, widgetId: string): TabLayout`

- [x] **Step 1: Write the failing tests**

Create `frontend/src/utils/tabLayout.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  clearLayout,
  defaultLayout,
  hideSlot,
  mergeSlots,
  moveSlot,
  nextGroupId,
  popWidget,
  readLayout,
  reconcileLayout,
  setActiveWidget,
  showSlot,
  writeLayout,
  type LayoutWidgetMeta,
  type TabLayout,
} from "./tabLayout";

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
    // …but merging half onto half works and group-onto-group concatenates.
    const twoGroups: TabLayout = {
      slots: [
        { id: "group-1", widgets: ["a", "b"] },
        { id: "group-2", widgets: ["c", "d"] },
      ],
      hiddenSlots: [],
    };
    // no nesting: group-2's widgets are absorbed
    const merged = mergeSlots(twoGroups, "group-2", "group-1", WIDGETS);
    expect(merged.slots.map((s) => s.id)).toEqual(["group-1"]);
    expect(merged.slots[0].widgets).toEqual(["a", "b"]);
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
      slots: [{ id: "group-1", widgets: ["a", "b"], activeWidget: "b" }, single("c")],
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
```

- [x] **Step 2: Run tests to verify they fail**

Run (from `frontend/`): `npx vitest run src/utils/tabLayout.test.ts`
Expected: FAIL — `Cannot find module './tabLayout'` (or unresolved imports).

- [x] **Step 3: Implement `tabLayout.ts`**

Create `frontend/src/utils/tabLayout.ts`:

```ts
/**
 * Client-side, per-wallet persistence for a tab's widget layout, mirroring the
 * `tag_order`/`wallet_order` localStorage pattern. A layout is an ordered list
 * of visible "slots" plus a list of hidden slots. A slot holds one widget
 * (standalone card) or several (a tabbed group rendered via SwitchableCard).
 *
 * Everything here is pure except the read/write/clear helpers; the UI applies
 * a mutation and persists the result with `writeLayout`.
 */

export type WidgetSpan = "half" | "full";

/** Minimal widget metadata the layout model needs (decoupled from React). */
export interface LayoutWidgetMeta {
  id: string;
  span: WidgetSpan;
  /** Ships hidden until the user enables it (e.g. the heatmap). */
  hiddenByDefault?: boolean;
}

export interface LayoutSlot {
  /** Stable dnd key — the widget id for standalone slots, `group-<n>` for groups. */
  id: string;
  /** Member widget ids; length 1 = standalone card, >1 = tabbed group. */
  widgets: string[];
  /** Which member tab is shown (groups only). */
  activeWidget?: string;
}

export interface TabLayout {
  /** Visible slots, in display order (grid auto-flow). */
  slots: LayoutSlot[];
  /** Hidden slots — groups survive hiding intact. */
  hiddenSlots: LayoutSlot[];
}

const keyFor = (tabId: string, walletId: string) =>
  `tab_layout_${tabId}_${walletId}`;

export function defaultLayout(widgets: LayoutWidgetMeta[]): TabLayout {
  return {
    slots: widgets
      .filter((w) => !w.hiddenByDefault)
      .map((w) => ({ id: w.id, widgets: [w.id] })),
    hiddenSlots: widgets
      .filter((w) => w.hiddenByDefault)
      .map((w) => ({ id: w.id, widgets: [w.id] })),
  };
}

/**
 * Validate a stored layout against the registry, self-healing it: unknown or
 * duplicated widgets are dropped, mixed-span groups are split (the first
 * member's span wins), single-member groups dissolve, and registry widgets
 * missing from the store are appended (hidden when `hiddenByDefault`).
 */
export function reconcileLayout(
  stored: unknown,
  widgets: LayoutWidgetMeta[],
): TabLayout {
  const spanOf = new Map(widgets.map((w) => [w.id, w.span]));
  const seen = new Set<string>();

  const cleanList = (raw: unknown): LayoutSlot[] => {
    if (!Array.isArray(raw)) return [];
    const out: LayoutSlot[] = [];
    for (const s of raw as Partial<LayoutSlot>[]) {
      if (!s || typeof s.id !== "string" || !Array.isArray(s.widgets)) continue;
      const members = s.widgets.filter(
        (w): w is string =>
          typeof w === "string" && spanOf.has(w) && !seen.has(w),
      );
      members.forEach((w) => seen.add(w));
      if (members.length === 0) continue;

      // Same-span groups only: the first member's span wins, the rest pop out.
      const span = spanOf.get(members[0]);
      const kept = members.filter((w) => spanOf.get(w) === span);
      const popped = members.filter((w) => spanOf.get(w) !== span);

      out.push({
        id: kept.length > 1 ? s.id : kept[0],
        widgets: kept,
        ...(kept.length > 1 &&
        typeof s.activeWidget === "string" &&
        kept.includes(s.activeWidget)
          ? { activeWidget: s.activeWidget }
          : {}),
      });
      popped.forEach((w) => out.push({ id: w, widgets: [w] }));
    }
    return out;
  };

  const asStored = stored as Partial<TabLayout> | null;
  const slots = cleanList(asStored?.slots);
  const hiddenSlots = cleanList(asStored?.hiddenSlots);

  for (const w of widgets) {
    if (seen.has(w.id)) continue;
    (w.hiddenByDefault ? hiddenSlots : slots).push({
      id: w.id,
      widgets: [w.id],
    });
  }
  return { slots, hiddenSlots };
}

export function readLayout(
  tabId: string,
  walletId: string,
  widgets: LayoutWidgetMeta[],
): TabLayout {
  try {
    const raw = localStorage.getItem(keyFor(tabId, walletId));
    if (!raw) return defaultLayout(widgets);
    return reconcileLayout(JSON.parse(raw), widgets);
  } catch (e) {
    console.error("Error parsing tab layout from localStorage", e);
    return defaultLayout(widgets);
  }
}

export function writeLayout(
  tabId: string,
  walletId: string,
  layout: TabLayout,
): void {
  try {
    localStorage.setItem(keyFor(tabId, walletId), JSON.stringify(layout));
  } catch (e) {
    console.error("Error writing tab layout to localStorage", e);
  }
}

export function clearLayout(tabId: string, walletId: string): void {
  try {
    localStorage.removeItem(keyFor(tabId, walletId));
  } catch (e) {
    console.error("Error clearing tab layout from localStorage", e);
  }
}

/* ------------------------------------------------------------------ *
 *  Pure layout mutations — callers persist the result via writeLayout.
 *  Every mutation returns the SAME reference when it doesn't apply, so
 *  callers (and tests) can cheaply detect no-ops.
 * ------------------------------------------------------------------ */

/** Move a visible slot to the position of `overId` (drag reorder). */
export function moveSlot(
  layout: TabLayout,
  activeId: string,
  overId: string,
): TabLayout {
  const from = layout.slots.findIndex((s) => s.id === activeId);
  const to = layout.slots.findIndex((s) => s.id === overId);
  if (from === -1 || to === -1 || from === to) return layout;
  const slots = [...layout.slots];
  const [moved] = slots.splice(from, 1);
  slots.splice(to, 0, moved);
  return { ...layout, slots };
}

/** Next free `group-<n>` id across visible + hidden slots. */
export function nextGroupId(layout: TabLayout): string {
  const used = [...layout.slots, ...layout.hiddenSlots]
    .map((s) => /^group-(\d+)$/.exec(s.id)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number);
  return `group-${used.length > 0 ? Math.max(...used) + 1 : 1}`;
}

/**
 * Merge the source slot into the target (folder-style grouping). No-op unless
 * both slots are visible and share the same span. The merged group keeps the
 * target's position; the freshly added widget becomes the active tab. Merging
 * a group absorbs its members (no nesting).
 */
export function mergeSlots(
  layout: TabLayout,
  sourceId: string,
  targetId: string,
  widgets: LayoutWidgetMeta[],
): TabLayout {
  if (sourceId === targetId) return layout;
  const source = layout.slots.find((s) => s.id === sourceId);
  const target = layout.slots.find((s) => s.id === targetId);
  if (!source || !target) return layout;

  const spanOf = new Map(widgets.map((w) => [w.id, w.span]));
  if (spanOf.get(source.widgets[0]) !== spanOf.get(target.widgets[0])) {
    return layout;
  }

  const merged: LayoutSlot = {
    id: target.widgets.length > 1 ? target.id : nextGroupId(layout),
    widgets: [...target.widgets, ...source.widgets],
    activeWidget: source.widgets[0],
  };
  return {
    ...layout,
    slots: layout.slots
      .filter((s) => s.id !== sourceId)
      .map((s) => (s.id === targetId ? merged : s)),
  };
}

/**
 * Pop a widget out of a group into a standalone slot right after it.
 * A group left with one member dissolves back into a standalone slot.
 */
export function popWidget(
  layout: TabLayout,
  slotId: string,
  widgetId: string,
): TabLayout {
  const idx = layout.slots.findIndex((s) => s.id === slotId);
  const slot = layout.slots[idx];
  if (!slot || slot.widgets.length < 2 || !slot.widgets.includes(widgetId)) {
    return layout;
  }

  const remaining = slot.widgets.filter((w) => w !== widgetId);
  const reduced: LayoutSlot =
    remaining.length === 1
      ? { id: remaining[0], widgets: remaining }
      : {
          id: slot.id,
          widgets: remaining,
          activeWidget:
            slot.activeWidget === widgetId
              ? remaining[0]
              : slot.activeWidget,
        };

  const slots = [...layout.slots];
  slots.splice(idx, 1, reduced, { id: widgetId, widgets: [widgetId] });
  return { ...layout, slots };
}

/** Hide a visible slot (groups hide as one unit). */
export function hideSlot(layout: TabLayout, slotId: string): TabLayout {
  const slot = layout.slots.find((s) => s.id === slotId);
  if (!slot) return layout;
  return {
    slots: layout.slots.filter((s) => s.id !== slotId),
    hiddenSlots: [...layout.hiddenSlots, slot],
  };
}

/** Restore a hidden slot, appended at the end of the grid. */
export function showSlot(layout: TabLayout, slotId: string): TabLayout {
  const slot = layout.hiddenSlots.find((s) => s.id === slotId);
  if (!slot) return layout;
  return {
    slots: [...layout.slots, slot],
    hiddenSlots: layout.hiddenSlots.filter((s) => s.id !== slotId),
  };
}

/** Switch the visible tab of a group slot. */
export function setActiveWidget(
  layout: TabLayout,
  slotId: string,
  widgetId: string,
): TabLayout {
  return {
    ...layout,
    slots: layout.slots.map((s) =>
      s.id === slotId && s.widgets.includes(widgetId)
        ? { ...s, activeWidget: widgetId }
        : s,
    ),
  };
}
```

Note on the `setActiveWidget` "ignoring foreign widgets" test: passing a widget not in the group must leave `activeWidget` unchanged (`undefined` in the test's fixture) — the map's condition already handles that.

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/tabLayout.test.ts`
Expected: PASS (all tests green).

- [x] **Step 5: Lint + typecheck**

Run: `npx eslint --fix src/utils/tabLayout.ts src/utils/tabLayout.test.ts && npx tsc -b`
Expected: exit 0, no output from tsc.

---

### Task 2: `bare` prop on the five chart widgets

**Files:**
- Modify: `frontend/src/dashboard/tag/CategoryCharts.tsx`
- Modify: `frontend/src/dashboard/tag/CategoryRanking.tsx`
- Modify: `frontend/src/dashboard/tag/CategoryTrendChart.tsx`
- Modify: `frontend/src/dashboard/tag/CategoryHeatmapChart.tsx`
- Modify: `frontend/src/dashboard/statistics/CashFlowSankey.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: each component gains an optional `bare?: boolean` prop (default `false`). When `bare` is true the component renders **without** its card shell (`bg-app-card/20 … rounded-2xl border`) and **without** its own title block, because the surrounding group `SwitchableCard` supplies both. Internal controls (Income/Expense `Selector`s, "show more" buttons, empty states) are kept.

These are presentational toggles — no new unit tests; the existing suite plus `tsc` guard regressions, and Task 4's grid tests cover the `bare` flag end-to-end via the registry contract.

- [x] **Step 1: `TransactionPieChart` (`CategoryCharts.tsx`)**

Add `bare` to the props (after `currency`):

```tsx
export const TransactionPieChart = ({
  transactions,
  type,
  title,
  currency = "EUR",
  bare = false,
}: {
  transactions: Transaction[];
  type: "INCOME" | "EXPENSE";
  title: string;
  /** Currency code for the centre total (defaults to EUR for the landing/demo usage). */
  currency?: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}) => {
```

Both return branches get the same treatment. Define once, right after the props destructuring block ends (after `const totalAmount = …`):

```tsx
  const shellClass = bare
    ? "flex flex-col items-center w-full h-full text-app-text"
    : "flex flex-col items-center w-full h-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border py-3 md:p-6 text-app-text";
```

In the **empty-state** branch replace the outer `<div className="flex flex-col items-center w-full h-full bg-app-card/20 …">` with `<div className={shellClass}>` and wrap the title:

```tsx
      {!bare && (
        <h3 className="text-xl font-bold text-app-text mb-6 uppercase tracking-wider opacity-50">
          {title}
        </h3>
      )}
```

In the **main** branch replace the outer div the same way (`<div className={shellClass}>`) and wrap its title:

```tsx
      {!bare && (
        <h3 className="text-xl font-bold text-app-text mb-6 uppercase tracking-wider">
          {title}
        </h3>
      )}
```

(The `title` prop stays required — the empty state's "No {title.toLowerCase()} data available." copy still uses it.)

- [x] **Step 2: `CategoryRanking.tsx`**

Extend the props interface and destructuring:

```tsx
interface CategoryRankingProps {
  transactions: Transaction[];
  type: "INCOME" | "EXPENSE";
  title: string;
  /** Currency symbol shown next to each amount (e.g. "€"). */
  currency: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}
```

```tsx
export const CategoryRanking: React.FC<CategoryRankingProps> = ({
  transactions,
  type,
  title,
  currency,
  bare = false,
}) => {
```

Replace the outer wrapper and title:

```tsx
    <div
      className={
        bare
          ? "flex flex-col w-full h-full text-app-text"
          : "flex flex-col w-full h-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border p-4 md:p-6 text-app-text"
      }
    >
      {!bare && (
        <h3 className="text-xl font-bold text-app-text mb-6 uppercase tracking-wider">
          {title}
        </h3>
      )}
```

- [x] **Step 3: `CategoryTrendChart.tsx`**

Extend props:

```tsx
interface CategoryTrendChartProps {
  transactions: Transaction[];
  /** Currency symbol shown in the tooltip (e.g. "€"). */
  currency: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}
```

Destructure `bare = false`. Replace the outer wrapper and the header row (keep the `Selector`, drop the title block, right-align when bare):

```tsx
    <div
      className={
        bare
          ? "flex flex-col w-full text-app-text"
          : "flex flex-col w-full bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border p-4 md:p-6 text-app-text"
      }
    >
      <div
        className={`mb-4 flex flex-wrap items-center gap-3 ${bare ? "justify-end" : "justify-between"}`}
      >
        {!bare && (
          <div>
            <h3 className="text-xl font-bold text-app-text uppercase tracking-wider">
              Category Trend
            </h3>
            <p className="text-sm text-app-muted">
              Top categories per month, stacked over time.
            </p>
          </div>
        )}
        <Selector … /> {/* unchanged */}
      </div>
```

- [x] **Step 4: `CategoryHeatmapChart.tsx`**

Identical pattern to Step 3 (same header structure): add `bare?: boolean` to `CategoryHeatmapChartProps` with the same doc comment, destructure `bare = false`, outer wrapper `bare ? "flex flex-col w-full text-app-text" : <current classes>`, header row `justify-end` when bare with the title block wrapped in `{!bare && (…)}`, `Selector` kept.

- [x] **Step 5: `CashFlowSankey.tsx`**

Extend props:

```tsx
interface CashFlowSankeyProps {
  transactions: Transaction[];
  /** Currency code for formatting (defaults to EUR for the landing/demo usage). */
  currency?: string;
  /** Render without the card shell + title (the parent group card provides them). */
  bare?: boolean;
}
```

Destructure `bare = false`. Replace the outer wrapper and heading:

```tsx
    <div
      className={
        bare
          ? "w-full"
          : "w-full p-1 sm:p-3 md:p-4 bg-app-card/20 backdrop-blur-sm rounded-2xl border border-app-border"
      }
    >
      {!bare && (
        <>
          <h2 className="text-center font-bold text-app-text text-lg md:text-2xl mb-1">
            Cash Flow Overview
          </h2>
          <p className="text-center text-app-muted text-sm md:text-base mb-2 md:mb-4">
            Flow from Income to Expenses
          </p>
        </>
      )}
```

- [x] **Step 6: Verify**

Run: `npx eslint --fix src/dashboard/tag/CategoryCharts.tsx src/dashboard/tag/CategoryRanking.tsx src/dashboard/tag/CategoryTrendChart.tsx src/dashboard/tag/CategoryHeatmapChart.tsx src/dashboard/statistics/CashFlowSankey.tsx && npx tsc -b && npx vitest run`
Expected: exit 0; all pre-existing tests + Task 1 tests pass (no component behaviour changed for existing callers — `bare` defaults to false).

---

### Task 3: Widget registry types, `useTabLayout` hook, Categories registry

**Files:**
- Create: `frontend/src/dashboard/layout/widgetTypes.ts`
- Create: `frontend/src/dashboard/layout/useTabLayout.ts`
- Create: `frontend/src/dashboard/tag/categoriesWidgets.tsx`

**Interfaces:**
- Consumes: Task 1's `tabLayout` exports; Task 2's `bare` props.
- Produces:
  - `WidgetDef<Ctx>` (extends `LayoutWidgetMeta`): `{ title: string; subtitle: string; label: string; icon: IconDefinition; render(ctx: Ctx, bare: boolean): React.ReactNode }`
  - `useTabLayout(tabId: string, walletId: string, widgets: LayoutWidgetMeta[]): TabLayoutApi` where `TabLayoutApi = { layout: TabLayout; move(activeId, overId): void; persist(): void; restore(snapshot: TabLayout): void; merge(sourceId, targetId): void; pop(slotId, widgetId): void; hide(slotId): void; show(slotId): void; setActive(slotId, widgetId): void; reset(): void }`
  - `CATEGORIES_TAB_ID = "categories"`, `interface CategoriesWidgetCtx { transactions: Transaction[]; currencyCode: string; currencySymbol: string }`, `CATEGORIES_WIDGETS: WidgetDef<CategoriesWidgetCtx>[]` (7 entries, ids: `income-pie`, `expense-pie`, `income-ranking`, `expense-ranking`, `trend`, `heatmap` (hiddenByDefault), `sankey`).

- [x] **Step 1: Create `widgetTypes.ts`**

```ts
import type React from "react";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import type { LayoutWidgetMeta } from "../../utils/tabLayout";

/**
 * One widget a customizable tab can display. `render` receives the tab's data
 * context plus `bare`: true when the widget is shown inside a group's
 * SwitchableCard, which provides the card chrome and title itself.
 */
export interface WidgetDef<Ctx> extends LayoutWidgetMeta {
  /** Full title — group-card header and accessibility labels. */
  title: string;
  /** One-line description shown under the title in a group-card header. */
  subtitle: string;
  /** Short label for group tabs and hidden-tray chips. */
  label: string;
  icon: IconDefinition;
  render: (ctx: Ctx, bare: boolean) => React.ReactNode;
}
```

- [x] **Step 2: Create `useTabLayout.ts`**

```ts
import { useState } from "react";
import {
  clearLayout,
  defaultLayout,
  hideSlot,
  mergeSlots,
  moveSlot,
  popWidget,
  readLayout,
  setActiveWidget,
  showSlot,
  writeLayout,
  type LayoutWidgetMeta,
  type TabLayout,
} from "../../utils/tabLayout";

export interface TabLayoutApi {
  layout: TabLayout;
  /** Transient reorder while dragging — call `persist` on drop. */
  move: (activeId: string, overId: string) => void;
  /** Persist the current (possibly transiently reordered) layout. */
  persist: () => void;
  /** Revert to a snapshot without persisting (drag cancel). */
  restore: (snapshot: TabLayout) => void;
  merge: (sourceId: string, targetId: string) => void;
  pop: (slotId: string, widgetId: string) => void;
  hide: (slotId: string) => void;
  show: (slotId: string) => void;
  setActive: (slotId: string, widgetId: string) => void;
  reset: () => void;
}

/**
 * Stateful wrapper around the pure tabLayout model: loads the layout for the
 * current wallet, re-reads it when the wallet switches (render-time sync — no
 * effect), and persists every committed mutation immediately (instant-apply).
 */
export function useTabLayout(
  tabId: string,
  walletId: string,
  widgets: LayoutWidgetMeta[],
): TabLayoutApi {
  const [layout, setLayout] = useState(() =>
    readLayout(tabId, walletId, widgets),
  );

  // Re-read when the wallet changes, without an effect (avoids a stale flash).
  const [syncKey, setSyncKey] = useState(walletId);
  if (syncKey !== walletId) {
    setSyncKey(walletId);
    setLayout(readLayout(tabId, walletId, widgets));
  }

  // The api object is recreated each render — callers always see fresh `layout`.
  const commit = (next: TabLayout) => {
    setLayout(next);
    writeLayout(tabId, walletId, next);
  };

  return {
    layout,
    move: (activeId, overId) =>
      setLayout((prev) => moveSlot(prev, activeId, overId)),
    persist: () => writeLayout(tabId, walletId, layout),
    restore: (snapshot) => setLayout(snapshot),
    merge: (sourceId, targetId) =>
      commit(mergeSlots(layout, sourceId, targetId, widgets)),
    pop: (slotId, widgetId) => commit(popWidget(layout, slotId, widgetId)),
    hide: (slotId) => commit(hideSlot(layout, slotId)),
    show: (slotId) => commit(showSlot(layout, slotId)),
    setActive: (slotId, widgetId) =>
      commit(setActiveWidget(layout, slotId, widgetId)),
    reset: () => {
      clearLayout(tabId, walletId);
      setLayout(defaultLayout(widgets));
    },
  };
}
```

Note: `merge`/`pop`/`hide`/`show`/`setActive` close over this render's `layout`. That is correct here because every mutation triggers a re-render and the consumers (`WidgetGrid`, `TagsTab`) receive the fresh api object as props before the next user interaction. `move` uses the functional form because dnd-kit fires `onDragOver` repeatedly between renders.

`persist` note: dnd-kit's `onDragEnd` fires on a later event than the last `onDragOver`, so React has re-rendered and the `persist` closure holds the up-to-date layout.

- [x] **Step 3: Create `categoriesWidgets.tsx`**

```tsx
import {
  faChartColumn,
  faChartPie,
  faDiagramProject,
  faRankingStar,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";
import type { Transaction } from "../../utils/types.ts";
import type { WidgetDef } from "../layout/widgetTypes.ts";
import { TransactionPieChart } from "./CategoryCharts.tsx";
import { CategoryRanking } from "./CategoryRanking.tsx";
import { CategoryTrendChart } from "./CategoryTrendChart.tsx";
import { CategoryHeatmapChart } from "./CategoryHeatmapChart.tsx";
import { CashFlowSankey } from "../statistics/CashFlowSankey.tsx";

export const CATEGORIES_TAB_ID = "categories";

/** Data the Categories-tab widgets need to render. */
export interface CategoriesWidgetCtx {
  /** The tab's date-filtered transactions. */
  transactions: Transaction[];
  /** ISO currency code for chart totals (e.g. "EUR"). */
  currencyCode: string;
  /** Currency symbol for row amounts (e.g. "€"). */
  currencySymbol: string;
}

/**
 * The Categories tab's widget registry. Order here = the default layout;
 * `hiddenByDefault` widgets start in the hidden tray.
 */
export const CATEGORIES_WIDGETS: WidgetDef<CategoriesWidgetCtx>[] = [
  {
    id: "income-pie",
    span: "half",
    title: "Income Distribution",
    subtitle: "Income by category and sub-category.",
    label: "Income",
    icon: faChartPie,
    render: (ctx, bare) => (
      <TransactionPieChart
        transactions={ctx.transactions}
        type="INCOME"
        title="Income Distribution"
        currency={ctx.currencyCode}
        bare={bare}
      />
    ),
  },
  {
    id: "expense-pie",
    span: "half",
    title: "Expense Distribution",
    subtitle: "Expenses by category and sub-category.",
    label: "Expenses",
    icon: faChartPie,
    render: (ctx, bare) => (
      <TransactionPieChart
        transactions={ctx.transactions}
        type="EXPENSE"
        title="Expense Distribution"
        currency={ctx.currencyCode}
        bare={bare}
      />
    ),
  },
  {
    id: "income-ranking",
    span: "half",
    title: "Top Income Categories",
    subtitle: "Which categories bring the most in.",
    label: "Top Income",
    icon: faRankingStar,
    render: (ctx, bare) => (
      <CategoryRanking
        transactions={ctx.transactions}
        type="INCOME"
        title="Top Income Categories"
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "expense-ranking",
    span: "half",
    title: "Top Expense Categories",
    subtitle: "Where the money goes, ranked.",
    label: "Top Expenses",
    icon: faRankingStar,
    render: (ctx, bare) => (
      <CategoryRanking
        transactions={ctx.transactions}
        type="EXPENSE"
        title="Top Expense Categories"
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "trend",
    span: "full",
    title: "Category Trend",
    subtitle: "Top categories per month, stacked over time.",
    label: "Trend",
    icon: faChartColumn,
    render: (ctx, bare) => (
      <CategoryTrendChart
        transactions={ctx.transactions}
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "heatmap",
    span: "full",
    hiddenByDefault: true,
    title: "Category Heatmap",
    subtitle: "Where the money concentrates, by category and month.",
    label: "Heatmap",
    icon: faTableCells,
    render: (ctx, bare) => (
      <CategoryHeatmapChart
        transactions={ctx.transactions}
        currency={ctx.currencySymbol}
        bare={bare}
      />
    ),
  },
  {
    id: "sankey",
    span: "full",
    title: "Cash Flow Overview",
    subtitle: "Flow from Income to Expenses.",
    label: "Cash Flow",
    icon: faDiagramProject,
    render: (ctx, bare) => (
      <CashFlowSankey
        transactions={ctx.transactions}
        currency={ctx.currencyCode}
        bare={bare}
      />
    ),
  },
];
```

- [x] **Step 4: Verify**

Run: `npx eslint --fix src/dashboard/layout/widgetTypes.ts src/dashboard/layout/useTabLayout.ts src/dashboard/tag/categoriesWidgets.tsx && npx tsc -b`
Expected: exit 0. (Nothing imports these yet; Task 4/5 wire them up. `npx vitest run` still green.)

---

### Task 4: `WidgetGrid` + `WidgetSlot` + `HiddenTray` (+ tests)

**Files:**
- Create: `frontend/src/dashboard/layout/WidgetSlot.tsx`
- Create: `frontend/src/dashboard/layout/HiddenTray.tsx`
- Create: `frontend/src/dashboard/layout/WidgetGrid.tsx`
- Test: `frontend/src/dashboard/layout/WidgetGrid.test.tsx`

**Interfaces:**
- Consumes: `TabLayoutApi` (Task 3), `WidgetDef` (Task 3), `SwitchableCard` (`../statistics/SwitchableCard.tsx`, props: `tabs: {key,title,label}[]`, `activeTab`, `onTabChange`, `title`, `subtitle`, `className`, children).
- Produces: `WidgetGrid<Ctx>` component with props `{ defs: WidgetDef<Ctx>[]; ctx: Ctx; editing: boolean; api: TabLayoutApi; accentColor: string }` — the only component Task 5 mounts.

**DnD model (read carefully):**
- One `DndContext`; `SortableContext` over visible slot ids with `rectSortingStrategy`. Sortable **transforms are intentionally not applied** — instead `onDragOver` live-reorders the state (`api.move`) and Framer Motion `layout` on each slot animates the reflow (FLIP). This is the only approach that stays correct with mixed spans (½ + full) in a CSS grid; strategy-computed transforms assume uniform sizes. `measuring: { droppable: { strategy: MeasuringStrategy.Always } }` keeps droppable rects fresh after each live reorder.
- Merge zones: each slot renders an absolutely-positioned droppable (`id = "merge:<slotId>"`, `inset-[18%]`) **only** while a *different, same-span* slot is being dragged in edit mode — invalid targets never expose a zone, so span mismatches naturally fall through to reorder. Custom collision detection: `pointerWithin` hits filtered to `merge:*` win; otherwise `closestCenter` over the real slots.
- The dragged original stays in place at reduced opacity; `DragOverlay` shows a same-size translucent ghost (icon + title + member count) — rendering live MUI charts in the overlay would be wasteful.
- Edit overlay = an absolute full-card layer that carries the sortable `listeners` (whole card = drag surface, also blocks chart interaction while editing) plus the hide button and, for groups, member chips with × (pop out). Buttons work despite the drag listeners thanks to the 5px `MouseSensor` activation distance (same pattern as `WalletCard`).

- [x] **Step 1: Create `WidgetSlot.tsx`**

```tsx
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEyeSlash,
  faUpDownLeftRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SwitchableCard } from "../statistics/SwitchableCard.tsx";
import type { WidgetDef } from "./widgetTypes.ts";
import type { LayoutSlot, WidgetSpan } from "../../utils/tabLayout";

export const mergeZoneId = (slotId: string) => `merge:${slotId}`;

interface WidgetSlotProps<Ctx> {
  slot: LayoutSlot;
  defs: Map<string, WidgetDef<Ctx>>;
  ctx: Ctx;
  editing: boolean;
  /** Wallet colour — accents the merge-target highlight. */
  accentColor: string;
  /** Span of the slot currently being dragged (null = no drag in progress). */
  activeSpan: WidgetSpan | null;
  /** Id of the slot currently being dragged. */
  activeId: string | null;
  /** True while a dragged slot hovers this slot's merge zone. */
  isMergeTarget: boolean;
  onHide: (slotId: string) => void;
  onPop: (slotId: string, widgetId: string) => void;
  onSetActive: (slotId: string, widgetId: string) => void;
}

/**
 * One grid slot: a standalone widget card, or a group rendered as a
 * SwitchableCard whose tabs are the member widgets (members render `bare`).
 * In edit mode an overlay turns the whole card into the drag surface and
 * exposes hide / pop-out controls; a central droppable appears on valid
 * (same-span) merge targets while a sibling is dragged.
 */
export function WidgetSlot<Ctx>({
  slot,
  defs,
  ctx,
  editing,
  accentColor,
  activeSpan,
  activeId,
  isMergeTarget,
  onHide,
  onPop,
  onSetActive,
}: WidgetSlotProps<Ctx>) {
  const members = slot.widgets
    .map((id) => defs.get(id))
    .filter((d): d is WidgetDef<Ctx> => d !== undefined);
  const first = members[0];
  const isGroup = members.length > 1;
  const activeWidgetId =
    isGroup && slot.activeWidget && slot.widgets.includes(slot.activeWidget)
      ? slot.activeWidget
      : slot.widgets[0];
  const activeDef = defs.get(activeWidgetId) ?? first;

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: slot.id,
    disabled: !editing,
  });
  // Sortable transforms are unused on purpose: onDragOver live-reorders the
  // slots and the framer `layout` prop animates the resulting reflow, which
  // stays correct for mixed half/full spans where strategy math does not.

  const canMerge =
    editing &&
    activeSpan !== null &&
    activeId !== null &&
    activeId !== slot.id &&
    activeSpan === first.span;
  const { setNodeRef: setMergeRef } = useDroppable({
    id: mergeZoneId(slot.id),
    disabled: !canMerge,
  });

  const hideLabel = isGroup
    ? members.map((m) => m.label).join(" + ")
    : first.title;

  return (
    <motion.div
      layout
      ref={setNodeRef}
      transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
      className={`relative h-full min-w-0 ${first.span === "full" ? "xl:col-span-2" : ""}`}
      style={{ opacity: isDragging ? 0.35 : 1 }}
    >
      {isGroup ? (
        <SwitchableCard
          className="h-full"
          tabs={members.map((m) => ({
            key: m.id,
            title: m.title,
            label: m.label,
          }))}
          activeTab={activeWidgetId}
          onTabChange={(key) => onSetActive(slot.id, key)}
          title={activeDef.title}
          subtitle={activeDef.subtitle}
        >
          {activeDef.render(ctx, true)}
        </SwitchableCard>
      ) : (
        first.render(ctx, false)
      )}

      {editing && (
        <div
          className="absolute inset-0 z-10 cursor-grab touch-none rounded-2xl outline-dashed outline-1 -outline-offset-1 outline-app-border active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-app-border bg-app-surface/90 text-app-muted shadow-sm">
            <FontAwesomeIcon icon={faUpDownLeftRight} className="text-xs" />
          </span>

          <button
            type="button"
            aria-label={`Hide ${hideLabel}`}
            onClick={() => onHide(slot.id)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-app-border bg-app-surface/90 text-app-muted shadow-sm transition-colors hover:border-app-red/40 hover:text-app-red"
          >
            <FontAwesomeIcon icon={faEyeSlash} className="text-xs" />
          </button>

          {isGroup && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              {members.map((m) => (
                <span
                  key={m.id}
                  className="flex items-center gap-1 rounded-full border border-app-border bg-app-surface/90 py-0.5 pl-2.5 pr-1 font-app-mono text-[11px] text-app-text shadow-sm"
                >
                  {m.label}
                  <button
                    type="button"
                    aria-label={`Remove ${m.label} from group`}
                    onClick={() => onPop(slot.id, m.id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-red/10 hover:text-app-red"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {canMerge && <div ref={setMergeRef} className="absolute inset-[18%] z-20" />}

      {isMergeTarget && (
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-2xl"
          style={{
            backgroundColor: `${accentColor}14`,
            boxShadow: `inset 0 0 0 2px ${accentColor}`,
          }}
        />
      )}
    </motion.div>
  );
}
```

- [x] **Step 2: Create `HiddenTray.tsx`**

```tsx
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEyeSlash, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { WidgetDef } from "./widgetTypes.ts";
import type { LayoutSlot } from "../../utils/tabLayout";

interface TrayChipProps {
  label: string;
  icon: WidgetDef<unknown>["icon"];
  accentColor: string;
  onShow: () => void;
}

/** One restorable chip; hovering tints it with the wallet colour. */
const TrayChip: React.FC<TrayChipProps> = ({
  label,
  icon,
  accentColor,
  onShow,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Show ${label}`}
      onClick={onShow}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-medium text-app-text shadow-sm transition-colors"
      style={
        hover
          ? {
              borderColor: accentColor,
              backgroundColor: `${accentColor}14`,
            }
          : undefined
      }
    >
      <FontAwesomeIcon icon={icon} className="text-xs text-app-muted" />
      {label}
      <FontAwesomeIcon
        icon={faPlus}
        className="text-[10px]"
        style={{ color: hover ? accentColor : "var(--color-app-muted)" }}
      />
    </button>
  );
};

interface HiddenTrayProps<Ctx> {
  hiddenSlots: LayoutSlot[];
  defs: Map<string, WidgetDef<Ctx>>;
  accentColor: string;
  onShow: (slotId: string) => void;
}

/** Edit-mode strip listing hidden widgets/groups; clicking a chip restores it. */
export function HiddenTray<Ctx>({
  hiddenSlots,
  defs,
  accentColor,
  onShow,
}: HiddenTrayProps<Ctx>) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-app-border bg-app-input/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-app-muted">
        <FontAwesomeIcon icon={faEyeSlash} className="text-xs" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Hidden widgets
        </span>
      </div>
      {hiddenSlots.length === 0 ? (
        <p className="text-sm text-app-muted/70">
          Nothing hidden — use the eye button on a card to hide it.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {hiddenSlots.map((slot) => {
            const members = slot.widgets
              .map((id) => defs.get(id))
              .filter((d): d is WidgetDef<Ctx> => d !== undefined);
            if (members.length === 0) return null;
            return (
              <TrayChip
                key={slot.id}
                label={members.map((m) => m.label).join(" + ")}
                icon={members[0].icon}
                accentColor={accentColor}
                onShow={() => onShow(slot.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 3: Create `WidgetGrid.tsx`**

```tsx
import { useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { LayoutGroup } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { TabLayout } from "../../utils/tabLayout";
import type { TabLayoutApi } from "./useTabLayout.ts";
import type { WidgetDef } from "./widgetTypes.ts";
import { HiddenTray } from "./HiddenTray.tsx";
import { WidgetSlot } from "./WidgetSlot.tsx";

const MERGE_PREFIX = "merge:";

/**
 * Merge zones win when the pointer is inside one (drop-on-center = group);
 * otherwise fall back to closest-center among the real slots (reorder).
 * Only valid targets render a merge zone, so span rules are enforced by
 * construction.
 */
const mergeAwareCollision: CollisionDetection = (args) => {
  const zones = pointerWithin(args).filter((c) =>
    String(c.id).startsWith(MERGE_PREFIX),
  );
  if (zones.length > 0) return zones;
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (c) => !String(c.id).startsWith(MERGE_PREFIX),
    ),
  });
};

interface WidgetGridProps<Ctx> {
  defs: WidgetDef<Ctx>[];
  ctx: Ctx;
  editing: boolean;
  api: TabLayoutApi;
  /** Wallet colour — accents merge highlights and tray chips. */
  accentColor: string;
}

/**
 * The customizable widget grid: fixed-span slots flowing in a 2-column grid
 * (1 column below xl), drag-to-reorder / drop-on-center-to-group in edit
 * mode, plus the hidden-widgets tray. Pure view over a TabLayoutApi.
 */
export function WidgetGrid<Ctx>({
  defs,
  ctx,
  editing,
  api,
  accentColor,
}: WidgetGridProps<Ctx>) {
  const defMap = useMemo(() => new Map(defs.map((d) => [d.id, d])), [defs]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const preDragLayout = useRef<TabLayout | null>(null);

  const activeSlot = activeId
    ? (api.layout.slots.find((s) => s.id === activeId) ?? null)
    : null;
  const activeMembers = activeSlot
    ? activeSlot.widgets
        .map((id) => defMap.get(id))
        .filter((d): d is WidgetDef<Ctx> => d !== undefined)
    : [];
  const activeSpan = activeMembers[0]?.span ?? null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    preDragLayout.current = api.layout;
    setActiveId(String(active.id));
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) {
      setMergeTarget(null);
      return;
    }
    const overId = String(over.id);
    if (overId.startsWith(MERGE_PREFIX)) {
      setMergeTarget(overId.slice(MERGE_PREFIX.length));
      return;
    }
    setMergeTarget(null);
    if (overId !== String(active.id)) api.move(String(active.id), overId);
  };

  const handleDragEnd = () => {
    if (activeId && mergeTarget) api.merge(activeId, mergeTarget);
    else api.persist();
    setActiveId(null);
    setMergeTarget(null);
    preDragLayout.current = null;
  };

  const handleDragCancel = () => {
    if (preDragLayout.current) api.restore(preDragLayout.current);
    setActiveId(null);
    setMergeTarget(null);
    preDragLayout.current = null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={mergeAwareCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={api.layout.slots.map((s) => s.id)}
        strategy={rectSortingStrategy}
      >
        <LayoutGroup>
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {api.layout.slots.map((slot) => (
              <WidgetSlot
                key={slot.id}
                slot={slot}
                defs={defMap}
                ctx={ctx}
                editing={editing}
                accentColor={accentColor}
                activeSpan={activeSpan}
                activeId={activeId}
                isMergeTarget={mergeTarget === slot.id}
                onHide={api.hide}
                onPop={api.pop}
                onSetActive={api.setActive}
              />
            ))}
          </div>
        </LayoutGroup>
      </SortableContext>

      {editing && (
        <HiddenTray
          hiddenSlots={api.layout.hiddenSlots}
          defs={defMap}
          accentColor={accentColor}
          onShow={api.show}
        />
      )}

      <DragOverlay dropAnimation={null}>
        {activeMembers.length > 0 && (
          <div className="flex h-full w-full items-center justify-center gap-2.5 rounded-2xl border border-app-border bg-app-card/80 shadow-2xl backdrop-blur-sm">
            <FontAwesomeIcon
              icon={activeMembers[0].icon}
              className="text-app-muted"
            />
            <span className="font-bold text-app-text">
              {activeMembers.length > 1
                ? activeMembers.map((m) => m.label).join(" + ")
                : activeMembers[0].title}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

- [x] **Step 4: Write the grid tests**

Create `frontend/src/dashboard/layout/WidgetGrid.test.tsx`. The dummy registry keeps MUI charts out of jsdom; `SwitchableCard` needs a mocked `WalletContext` (same technique as `CategoryManagerDrawer.test.tsx`).

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { faTag } from "@fortawesome/free-solid-svg-icons";

vi.mock("../wallet/WalletContext.tsx", () => ({ useWalletContext: vi.fn() }));

import { WidgetGrid } from "./WidgetGrid";
import { useTabLayout } from "./useTabLayout";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import type { WidgetDef } from "./widgetTypes";
import type { TabLayout } from "../../utils/tabLayout";

const mockedCtx = useWalletContext as unknown as ReturnType<typeof vi.fn>;

type Ctx = Record<string, never>;

const def = (
  id: string,
  span: "half" | "full",
  hiddenByDefault = false,
): WidgetDef<Ctx> => ({
  id,
  span,
  hiddenByDefault,
  title: `Title ${id.toUpperCase()}`,
  subtitle: `Subtitle ${id}`,
  label: id.toUpperCase(),
  icon: faTag,
  render: (_ctx, bare) => (
    <div data-testid={`widget-${id}`} data-bare={String(bare)} />
  ),
});

const DEFS: WidgetDef<Ctx>[] = [
  def("a", "half"),
  def("b", "half"),
  def("c", "full"),
  def("h", "full", true),
];

const KEY = "tab_layout_testtab_w1";

function Harness({ editing }: { editing: boolean }) {
  const api = useTabLayout("testtab", "w1", DEFS);
  return (
    <div>
      <button type="button" onClick={api.reset}>
        harness-reset
      </button>
      <WidgetGrid
        defs={DEFS}
        ctx={{}}
        editing={editing}
        api={api}
        accentColor="#8b5cf6"
      />
    </div>
  );
}

const storedLayout = (layout: TabLayout) =>
  localStorage.setItem(KEY, JSON.stringify(layout));

describe("WidgetGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedCtx.mockReturnValue({
      wallet: { id: "w1", color: "#8b5cf6" },
    });
  });

  it("renders visible widgets standalone (not bare); hidden ones stay out; no tray outside edit mode", () => {
    render(<Harness editing={false} />);
    expect(screen.getByTestId("widget-a")).toHaveAttribute(
      "data-bare",
      "false",
    );
    expect(screen.getByTestId("widget-b")).toBeInTheDocument();
    expect(screen.getByTestId("widget-c")).toBeInTheDocument();
    expect(screen.queryByTestId("widget-h")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden widgets")).not.toBeInTheDocument();
  });

  it("edit mode shows the tray; a chip restores the widget and persists it", () => {
    render(<Harness editing />);
    expect(screen.getByText("Hidden widgets")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show H" }));
    expect(screen.getByTestId("widget-h")).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["a", "b", "c", "h"]);
    expect(stored.hiddenSlots).toEqual([]);
  });

  it("the eye button hides a widget into the tray and persists", () => {
    render(<Harness editing />);
    fireEvent.click(screen.getByRole("button", { name: "Hide Title A" }));

    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show A" })).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["b", "c"]);
    expect(stored.hiddenSlots.map((s) => s.id)).toEqual(["h", "a"]);
  });

  it("renders a stored group as a SwitchableCard and switches tabs (bare members)", () => {
    storedLayout({
      slots: [
        { id: "group-1", widgets: ["a", "b"], activeWidget: "a" },
        { id: "c", widgets: ["c"] },
      ],
      hiddenSlots: [{ id: "h", widgets: ["h"] }],
    });
    render(<Harness editing={false} />);

    // Group header shows the active member's title; member renders bare.
    expect(screen.getByText("Title A")).toBeInTheDocument();
    expect(screen.getByTestId("widget-a")).toHaveAttribute("data-bare", "true");
    expect(screen.queryByTestId("widget-b")).not.toBeInTheDocument();

    // Switch to the B tab (desktop Selector renders one button per tab).
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(screen.getByTestId("widget-b")).toHaveAttribute("data-bare", "true");
    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots[0].activeWidget).toBe("b");
  });

  it("edit mode: popping a member out dissolves a 2-widget group", () => {
    storedLayout({
      slots: [
        { id: "group-1", widgets: ["a", "b"], activeWidget: "a" },
        { id: "c", widgets: ["c"] },
      ],
      hiddenSlots: [{ id: "h", widgets: ["h"] }],
    });
    render(<Harness editing />);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove B from group" }),
    );

    // Both widgets are standalone (not bare) now.
    expect(screen.getByTestId("widget-a")).toHaveAttribute(
      "data-bare",
      "false",
    );
    expect(screen.getByTestId("widget-b")).toHaveAttribute(
      "data-bare",
      "false",
    );
    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("hiding a group stores it as one unit and its chip restores it intact", () => {
    storedLayout({
      slots: [
        { id: "group-1", widgets: ["a", "b"] },
        { id: "c", widgets: ["c"] },
      ],
      hiddenSlots: [{ id: "h", widgets: ["h"] }],
    });
    render(<Harness editing />);

    fireEvent.click(screen.getByRole("button", { name: "Hide A + B" }));
    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show A + B" }));
    expect(screen.getByTestId("widget-a")).toHaveAttribute("data-bare", "true");

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["c", "group-1"]);
  });

  it("reset restores the default layout and clears storage", () => {
    storedLayout({
      slots: [{ id: "c", widgets: ["c"] }],
      hiddenSlots: [
        { id: "h", widgets: ["h"] },
        { id: "a", widgets: ["a"] },
        { id: "b", widgets: ["b"] },
      ],
    });
    render(<Harness editing />);
    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "harness-reset" }));
    expect(screen.getByTestId("widget-a")).toBeInTheDocument();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
```

- [x] **Step 5: Run the new tests**

Run: `npx vitest run src/dashboard/layout/WidgetGrid.test.tsx`
Expected: PASS. Two likely trip-wires if not:
- The group-tab test clicks `{ name: "B" }` — the Selector tab button's accessible name is its label text. If `useMedia` resolves mobile (it shouldn't: the setup stub returns `matches: false`), the desktop Selector won't render; fix the stub, not the component.
- `SwitchableCard` reads `useWalletContext()` — the mock above must return `{ wallet: { color: … } }` before each render.

- [x] **Step 6: Lint + typecheck + full suite**

Run: `npx eslint --fix src/dashboard/layout/*.tsx src/dashboard/layout/*.ts && npx tsc -b && npx vitest run`
Expected: exit 0, all tests green.

---

### Task 5: TagsTab integration

**Files:**
- Modify: `frontend/src/dashboard/tag/TagsTab.tsx`

**Interfaces:**
- Consumes: `useTabLayout`, `WidgetGrid`, `CATEGORIES_TAB_ID` / `CATEGORIES_WIDGETS` / `CategoriesWidgetCtx`.
- Produces: the final page — nothing downstream consumes it.

- [x] **Step 1: Rewrite `TagsTab.tsx`**

Full new content (replaces the hardcoded chart sections; `DateRangeBanner`, header, `CategoryManagerDrawer`, and the MUI `ThemeProvider` wrapper stay):

```tsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faLayerGroup,
  faRotateLeft,
  faUpDownLeftRight,
} from "@fortawesome/free-solid-svg-icons";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { CURRENCY_META, type CurrencyCode } from "../../utils/currencies.ts";
import { DateRangeBanner } from "../statistics/DateRangeBanner.tsx";
import { useTheme } from "../../utils/ThemeContext.tsx";
import Button from "../../components/ui/Button.tsx";
import { CategoryManagerDrawer } from "./CategoryManagerDrawer.tsx";
import { useTabLayout } from "../layout/useTabLayout.ts";
import { WidgetGrid } from "../layout/WidgetGrid.tsx";
import {
  CATEGORIES_TAB_ID,
  CATEGORIES_WIDGETS,
  type CategoriesWidgetCtx,
} from "./categoriesWidgets.tsx";

const lightTheme = createTheme({
  palette: { mode: "light", background: { paper: "#ffffff" } },
});

const darkTheme = createTheme({
  palette: { mode: "dark", background: { paper: "var(--color-app-card)" } },
});

export const TagsTab: React.FC = () => {
  const { filteredTransactions, wallet } = useWalletContext();
  const { resolvedTheme } = useTheme();
  const [managerOpen, setManagerOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const currencySymbol =
    CURRENCY_META[wallet.currency as CurrencyCode]?.symbol ?? wallet.currency;

  const layoutApi = useTabLayout(
    CATEGORIES_TAB_ID,
    wallet.id,
    CATEGORIES_WIDGETS,
  );

  const ctx: CategoriesWidgetCtx = {
    transactions: filteredTransactions,
    currencyCode: wallet.currency,
    currencySymbol,
  };

  return (
    <ThemeProvider theme={resolvedTheme === "dark" ? darkTheme : lightTheme}>
      <div className="relative flex flex-1 flex-col pb-10 animate-[fadeIn_0.3s_ease-out]">
        <DateRangeBanner />

        <div className="mb-4 mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-app-text">
              Visual Distribution
            </h2>
            <p className="text-sm text-app-muted">
              Analyze your income and expenses by category and sub-category.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="ghost" onClick={layoutApi.reset}>
                  <FontAwesomeIcon icon={faRotateLeft} />
                  Reset
                </Button>
                <Button variant="primary" onClick={() => setEditing(false)}>
                  <FontAwesomeIcon icon={faCheck} />
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <FontAwesomeIcon icon={faUpDownLeftRight} />
                  Edit Layout
                </Button>
                <Button variant="secondary" onClick={() => setManagerOpen(true)}>
                  <FontAwesomeIcon icon={faLayerGroup} />
                  Manage Categories
                </Button>
              </>
            )}
          </div>
        </div>

        <WidgetGrid
          defs={CATEGORIES_WIDGETS}
          ctx={ctx}
          editing={editing}
          api={layoutApi}
          accentColor={wallet.color}
        />

        <CategoryManagerDrawer
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
};
```

Removed imports (`TransactionPieChart`, `CategoryRanking`, `CategoryTrendChart`, `CashFlowSankey`, the commented `CategoryHeatmapChart` line) now live in `categoriesWidgets.tsx` — the heatmap is thereby resurrected as a hidden-by-default widget.

- [x] **Step 2: Verify**

Run: `npx eslint --fix src/dashboard/tag/TagsTab.tsx && npx tsc -b && npx vitest run && npm run build`
Expected: all green; build succeeds (PWA precache output).

---

### Task 6: End-to-end verification & knowledge-graph update

**Files:** none (verification only).

- [ ] **Step 1: Full gate**

Run from `frontend/`: `npm run lint && npx tsc -b && npx vitest run && npm run build`
Expected: exit 0 everywhere.

- [ ] **Step 2: Manual smoke on :5173** (dev server is already running — do NOT restart it)

Checklist (report actual results, don't assume):
1. Categories tab renders exactly as before by default (pies, rankings, trend, sankey; no heatmap; no tray).
2. "Edit Layout" → cards get dashed outlines + move/hide affordances; charts stop responding to hover; tray shows a "Heatmap" chip.
3. Drag a pie between/onto cards: edge drop reorders (cards shift as the gap moves); center drop on the other pie/rankings shows the wallet-colour ring and creates a tabbed group; center of the full-width Sankey shows NO ring for a half card.
4. Group card: tabs switch charts (outside edit mode), header shows the active chart's title; edit mode shows member chips; × pops a member out; hiding the group hides it whole; restoring brings the group back.
5. Reset restores the default order; Done exits; reload → layout persists per wallet (switch wallet → independent layout).
6. Mobile viewport (devtools): single column, long-press drag works, tabs render as the title dropdown.

- [ ] **Step 3: Update the knowledge graph**

Run from repo root: `graphify update .`
Expected: graph refreshed to include the new `dashboard/layout/` module.

---

## Self-review notes (already applied)

- Spec coverage: scope/generic core (registry + `tabId`), 7 widgets incl. resurrected heatmap ✔; reorder-in-flow fixed spans ✔; folder-style merge, same-span only (invalid targets expose no zone — the agreed "rejection") ✔; SwitchableCard groups with bare members + pop-out ✔; hide tray + group-as-unit ✔; instant apply + Reset/Done ✔; per-wallet localStorage ✔; mobile long-press ✔; VIEWER unaffected ✔.
- Type consistency: `TabLayoutApi` names (`move/persist/restore/merge/pop/hide/show/setActive/reset`) match between Task 3 (definition), Task 4 (usage), Task 5 (reset). `WidgetDef` fields (`title/subtitle/label/icon/render/span/hiddenByDefault`) consistent across Tasks 3–4.
- Known accepted trade-offs: group members unmount on tab switch (internal chart state resets — same as `StatisticsTab` today); in edit mode charts are intentionally inert; DragOverlay shows a ghost card, not the live chart.
