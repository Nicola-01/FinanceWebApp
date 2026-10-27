import type { LayoutSlot, LayoutWidgetMeta, TabLayout } from "./types";

/* ------------------------------------------------------------------ *
 *  Pure layout mutations — callers persist the result via writeLayout.
 *  Every mutation returns the SAME reference when it doesn't apply, so
 *  callers (and tests) can cheaply detect no-ops.
 * ------------------------------------------------------------------ */

/**
 * Move a visible slot to `index` in the list WITHOUT it (0..slots.length-1).
 * The geometric drag reorder computes its target index over the *other* slots,
 * so this matches that convention directly. No-op (same reference) when the slot
 * would land back where it started or is unknown.
 */
export function moveSlotToIndex(
  layout: TabLayout,
  activeId: string,
  index: number,
): TabLayout {
  const from = layout.slots.findIndex((s) => s.id === activeId);
  if (from === -1) return layout;
  const slots = [...layout.slots];
  const [moved] = slots.splice(from, 1);
  const to = Math.max(0, Math.min(index, slots.length));
  if (to === from) return layout; // lands back in place
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

/** Reorder a member within a group (Feature 3). No-op for standalone slots or unknown ids. */
export function reorderMember(
  layout: TabLayout,
  slotId: string,
  fromWidgetId: string,
  toWidgetId: string,
): TabLayout {
  const gi = layout.slots.findIndex((s) => s.id === slotId);
  const slot = layout.slots[gi];
  if (!slot || slot.widgets.length < 2 || fromWidgetId === toWidgetId)
    return layout;
  const from = slot.widgets.indexOf(fromWidgetId);
  const to = slot.widgets.indexOf(toWidgetId);
  if (from === -1 || to === -1) return layout;
  const widgets = [...slot.widgets];
  const [m] = widgets.splice(from, 1);
  widgets.splice(to, 0, m);
  const slots = [...layout.slots];
  slots[gi] = { ...slot, widgets };
  return { ...layout, slots };
}

/**
 * Pop a member out of a group into a standalone slot inserted at grid index `atIndex`
 * (Feature 2 drop-at-position). A 2-member group dissolves; activeWidget heals if the
 * popped member was active. No-op for standalone slots or a missing member.
 */
export function popWidgetTo(
  layout: TabLayout,
  slotId: string,
  widgetId: string,
  atIndex: number,
): TabLayout {
  const gi = layout.slots.findIndex((s) => s.id === slotId);
  const slot = layout.slots[gi];
  if (!slot || slot.widgets.length < 2 || !slot.widgets.includes(widgetId))
    return layout;
  const remaining = slot.widgets.filter((w) => w !== widgetId);
  if (remaining.length === 0) return layout; // defensive
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
  slots[gi] = reduced;
  const idx = Math.max(0, Math.min(atIndex, slots.length));
  slots.splice(idx, 0, { id: widgetId, widgets: [widgetId] });
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
