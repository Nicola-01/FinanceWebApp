import { useState } from "react";
import {
  hideSlot,
  mergeSlots,
  moveSlotToIndex,
  popWidgetTo,
  reorderMember,
  setActiveWidget,
  showSlot,
} from "../../utils/tabLayout/mutations";
import {
  clearLayout,
  defaultLayout,
  readLayout,
  writeLayout,
} from "../../utils/tabLayout/storage";
import type { LayoutWidgetMeta, TabLayout } from "../../utils/tabLayout/types";

export interface TabLayoutApi {
  layout: TabLayout;
  /** Persist the current (possibly transiently reordered) layout. */
  persist: () => void;
  /** Revert to a snapshot without persisting (drag cancel). */
  restore: (snapshot: TabLayout) => void;
  merge: (sourceId: string, targetId: string) => void;
  /** Commit a slot reorder to a geometric index (list without the active slot). */
  reorderSlotToIndex: (activeId: string, index: number) => void;
  reorderMember: (
    slotId: string,
    fromWidgetId: string,
    toWidgetId: string,
  ) => void;
  popTo: (slotId: string, widgetId: string, atIndex: number) => void;
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
    persist: () => writeLayout(tabId, walletId, layout),
    restore: (snapshot) => setLayout(snapshot),
    merge: (sourceId, targetId) =>
      commit(mergeSlots(layout, sourceId, targetId, widgets)),
    reorderSlotToIndex: (activeId, index) =>
      commit(moveSlotToIndex(layout, activeId, index)),
    reorderMember: (slotId, fromWidgetId, toWidgetId) =>
      commit(reorderMember(layout, slotId, fromWidgetId, toWidgetId)),
    popTo: (slotId, widgetId, atIndex) =>
      commit(popWidgetTo(layout, slotId, widgetId, atIndex)),
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
