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
