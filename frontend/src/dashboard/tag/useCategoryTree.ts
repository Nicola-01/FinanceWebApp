import { useMemo, useState } from "react";
import type { Tag, Transaction } from "../../types/domain.ts";
import {
  applyTagOrder,
  countTagUsage,
  readSortMode,
  sortTree,
  writeSortMode,
  type TagSortMode,
  type TagTreeNode,
} from "../../utils/tagOrder.ts";

/**
 * The wallet's category tree as local state: the custom (drag) order derived
 * from tags + the saved order, the sort mode, usage counts and the
 * display-ordered tree.
 */
export function useCategoryTree(
  walletId: string,
  tags: Tag[],
  transactions: Transaction[],
) {
  const [tree, setTree] = useState<TagTreeNode[]>(() =>
    applyTagOrder(walletId, tags),
  );

  // Sort mode drives the display order in both this drawer and the TagPicker.
  // `tree` always holds the *custom* (drag) order; other modes are derived from
  // it for display, and reordering by drag is only offered in custom mode.
  const [sortMode, setSortMode] = useState<TagSortMode>(() =>
    readSortMode(walletId),
  );
  const [modeWallet, setModeWallet] = useState(walletId);
  if (modeWallet !== walletId) {
    setModeWallet(walletId);
    setSortMode(readSortMode(walletId));
  }
  const changeSort = (mode: TagSortMode) => {
    setSortMode(mode);
    writeSortMode(walletId, mode);
  };

  const counts = useMemo(() => countTagUsage(transactions), [transactions]);
  const orderedTree = useMemo(
    () => sortTree(tree, sortMode, counts),
    [tree, sortMode, counts],
  );

  // Resync the derived tree when the underlying tags change (add / delete /
  // rename / reparent / recolor / re-icon) or the wallet switches. Render-time
  // reconciliation (React-endorsed) rather than an effect: `tree` is derived
  // from tags + the saved order, and drag handlers keep localStorage in step.
  // Stale saved names are harmless and get pruned on the next persist.
  // The key must reflect every rendered field: colour/icon changes don't touch
  // name/parent, so omitting them left the tree showing stale colours until a
  // full reload (rows read colour from this local tree, not from context).
  const derivedKey = `${walletId}|${tags
    .map((t) => `${t.name}:${t.parentName ?? ""}:${t.colorHex}:${t.icon}`)
    .join(",")}`;
  const [syncKey, setSyncKey] = useState(derivedKey);
  if (syncKey !== derivedKey) {
    setSyncKey(derivedKey);
    setTree(applyTagOrder(walletId, tags));
  }

  return { tree, setTree, sortMode, changeSort, counts, orderedTree };
}
