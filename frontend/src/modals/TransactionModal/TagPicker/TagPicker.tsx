import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../../utils/types";
import { TagTreePicker } from "../../../components/TagSelector/TagTreePicker.tsx";
import { useWalletContext } from "../../../dashboard/wallet/WalletContext.tsx";
import { CategoryManagerDrawer } from "../../../dashboard/tag/CategoryManagerDrawer.tsx";
import {
  countTagUsage,
  orderTags,
  readSortMode,
} from "../../../utils/tagOrder.ts";

interface TagPickerProps {
  tags: Tag[];
  showLabel?: boolean;
  selectedTagName: string;
  onSelectTag: (tagName: string) => void;
}

/**
 * Wallet-aware category picker for the transaction / subscription forms: the
 * shared {@link TagTreePicker} tree, plus the concerns that need a live wallet —
 * the wallet accent colour, usage-based ordering (same sort mode as the
 * Category Manager) and the "Manage categories" drawer.
 */
export const TagPicker: React.FC<TagPickerProps> = ({
  tags,
  selectedTagName,
  onSelectTag,
  showLabel = true,
}) => {
  // Accent everything (trigger, selection, ancestor) with the wallet's colour.
  const { wallet, transactions } = useWalletContext();
  const color = wallet.color;

  // Order the list with the same sort mode chosen in the Category Manager.
  const counts = useMemo(() => countTagUsage(transactions), [transactions]);
  const [sortMode, setSortMode] = useState(() => readSortMode(wallet.id));
  const orderedTags = useMemo(
    () => orderTags(wallet.id, tags, sortMode, counts),
    [wallet.id, tags, sortMode, counts],
  );

  const [managerOpen, setManagerOpen] = useState(false);
  // Deep-link: if opened while drilled into a category, expand it there.
  const [managerParent, setManagerParent] = useState<string | null>(null);

  return (
    <TagTreePicker
      tags={orderedTags}
      color={color}
      selectedTagName={selectedTagName}
      onSelectTag={onSelectTag}
      showLabel={showLabel}
      onOpen={() => setSortMode(readSortMode(wallet.id))}
      footerSlot={({ currentParentName }) => (
        // Categories are created / organized in the manager drawer.
        <div className="mt-2 border-t border-app-border pt-2">
          <button
            type="button"
            onClick={() => {
              setManagerParent(currentParentName);
              setManagerOpen(true);
            }}
            className="group flex w-full items-center gap-3 rounded-lg border border-dashed border-app-border p-2.5 text-left transition-colors hover:bg-app-input"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-input transition-colors group-hover:bg-app-surface">
              <FontAwesomeIcon
                icon={faLayerGroup}
                className="text-app-muted group-hover:text-app-text"
              />
            </div>
            <span className="text-sm font-medium text-app-muted group-hover:text-app-text">
              Manage categories
            </span>
          </button>
        </div>
      )}
    >
      <CategoryManagerDrawer
        open={managerOpen}
        onClose={() => {
          setManagerOpen(false);
          setSortMode(readSortMode(wallet.id));
        }}
        initialExpandedParent={managerParent}
      />
    </TagTreePicker>
  );
};
