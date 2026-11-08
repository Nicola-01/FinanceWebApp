import React, { useMemo, useState } from "react";
import { faLayerGroup } from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../types/domain";
import { TagTreePicker } from "../../components/tags/TagTreePicker.tsx";
import { DropdownManageButton } from "../../components/ui/DropdownManageButton.tsx";
import { useWalletContext } from "../../dashboard/wallet/WalletContext.tsx";
import { CategoryManagerDrawer } from "../../dashboard/tag/CategoryManagerDrawer.tsx";
import {
  countTagUsage,
  orderTags,
  readSortMode,
} from "../../utils/tagOrder.ts";

interface TagPickerProps {
  tags: Tag[];
  showLabel?: boolean;
  selectedTagName: string;
  onSelectTag: (tagName: string) => void;
  dropdownClassName?: string;
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
  dropdownClassName,
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
      dropdownClassName={dropdownClassName}
      onOpen={() => setSortMode(readSortMode(wallet.id))}
      footerSlot={({ currentParentName }) => (
        // Categories are created / organized in the manager drawer.
        <DropdownManageButton
          icon={faLayerGroup}
          label="Manage categories"
          onClick={() => {
            setManagerParent(currentParentName);
            setManagerOpen(true);
          }}
        />
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
