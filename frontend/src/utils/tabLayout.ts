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
<<<<<<< HEAD
  // Group ids must be unique across visible + hidden slots (they are React
  // keys and dnd ids); corrupt stores may repeat one, so collisions rename.
  const usedGroupIds = new Set<string>();
  const freshGroupId = (): string => {
    let n = 1;
    while (usedGroupIds.has(`group-${n}`)) n += 1;
    return `group-${n}`;
  };
=======
>>>>>>> c9d2ebe (Ui update)

  const cleanList = (raw: unknown): LayoutSlot[] => {
    if (!Array.isArray(raw)) return [];
    const out: LayoutSlot[] = [];
    for (const s of raw as Partial<LayoutSlot>[]) {
      if (!s || typeof s.id !== "string" || !Array.isArray(s.widgets)) continue;
<<<<<<< HEAD
      // Dedupe as we filter so a widget repeated INSIDE one slot is dropped
      // too (not just repeats across slots).
      const members: string[] = [];
      for (const w of s.widgets) {
        if (typeof w === "string" && spanOf.has(w) && !seen.has(w)) {
          seen.add(w);
          members.push(w);
        }
      }
=======
      const members = s.widgets.filter(
        (w): w is string =>
          typeof w === "string" && spanOf.has(w) && !seen.has(w),
      );
      members.forEach((w) => seen.add(w));
>>>>>>> c9d2ebe (Ui update)
      if (members.length === 0) continue;

      // Same-span groups only: the first member's span wins, the rest pop out.
      const span = spanOf.get(members[0]);
      const kept = members.filter((w) => spanOf.get(w) === span);
      const popped = members.filter((w) => spanOf.get(w) !== span);

<<<<<<< HEAD
      // Standalone slot ids equal the widget id (unique by the dedupe above);
      // group ids must match `group-<n>` and be unused, else they are renamed.
      let slotId: string;
      if (kept.length > 1) {
        slotId =
          /^group-\d+$/.test(s.id) && !usedGroupIds.has(s.id)
            ? s.id
            : freshGroupId();
        usedGroupIds.add(slotId);
      } else {
        slotId = kept[0];
      }

      out.push({
        id: slotId,
=======
      out.push({
        id: kept.length > 1 ? s.id : kept[0],
>>>>>>> c9d2ebe (Ui update)
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
<<<<<<< HEAD
  // Defensive: a corrupt slot repeating `widgetId` could empty out entirely;
  // never commit an empty slot (reconcileLayout heals the store on next read).
  if (remaining.length === 0) return layout;
=======
>>>>>>> c9d2ebe (Ui update)
  const reduced: LayoutSlot =
    remaining.length === 1
      ? { id: remaining[0], widgets: remaining }
      : {
          id: slot.id,
          widgets: remaining,
          activeWidget:
            slot.activeWidget === widgetId ? remaining[0] : slot.activeWidget,
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
