/**
 * Client-side, per-wallet persistence for a tab's widget layout, mirroring the
 * `tag_order`/`wallet_order` localStorage pattern. A layout is an ordered list
 * of visible "slots" plus a list of hidden slots. A slot holds one widget
 * (standalone card) or several (a tabbed group rendered via SwitchableCard).
 *
 * Everything here is pure except the read/write/clear helpers; the UI applies
 * a mutation and persists the result with `writeLayout`.
 */

import type { LayoutSlot, LayoutWidgetMeta, TabLayout } from "./types";

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
  // Group ids must be unique across visible + hidden slots (they are React
  // keys and dnd ids); corrupt stores may repeat one, so collisions rename.
  const usedGroupIds = new Set<string>();
  const freshGroupId = (): string => {
    let n = 1;
    while (usedGroupIds.has(`group-${n}`)) n += 1;
    return `group-${n}`;
  };

  const cleanList = (raw: unknown): LayoutSlot[] => {
    if (!Array.isArray(raw)) return [];
    const out: LayoutSlot[] = [];
    for (const s of raw as Partial<LayoutSlot>[]) {
      if (!s || typeof s.id !== "string" || !Array.isArray(s.widgets)) continue;
      // Dedupe as we filter so a widget repeated INSIDE one slot is dropped
      // too (not just repeats across slots).
      const members: string[] = [];
      for (const w of s.widgets) {
        if (typeof w === "string" && spanOf.has(w) && !seen.has(w)) {
          seen.add(w);
          members.push(w);
        }
      }
      if (members.length === 0) continue;

      // Same-span groups only: the first member's span wins, the rest pop out.
      const span = spanOf.get(members[0]);
      const kept = members.filter((w) => spanOf.get(w) === span);
      const popped = members.filter((w) => spanOf.get(w) !== span);

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
