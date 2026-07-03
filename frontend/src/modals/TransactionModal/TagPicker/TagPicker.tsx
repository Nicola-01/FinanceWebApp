import React, { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronUp,
  faHashtag,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../../utils/types";
import { Icon } from "../../../components/icon/Icon.tsx";
import {
  TagRow,
  type TagRowTrailing,
} from "../../../components/TagSelector/TagRow.tsx";
import { TagDropdownPanel } from "../../../components/TagSelector/TagDropdownPanel.tsx";
import { useTagTree } from "../../../components/TagSelector/useTagTree.ts";
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
 * Single-select category picker for the transaction / subscription forms: a
 * labelled select trigger opening a drill-down list. Selection is shown by
 * highlighting the row (no checkbox); includes the inline "add tag" form.
 * Shares TagRow, the tree hook and the dropdown panel with TagFilter.
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

  const {
    isOpen,
    open,
    close,
    dropdownRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    filteredGroups,
  } = useTagTree(orderedTags);

  const [currentParentName, setCurrentParentName] = useState<string | null>(
    null,
  );
  const [managerOpen, setManagerOpen] = useState(false);

  // Reset drill + re-read the latest sort order on each fresh open.
  const openPicker = () => {
    if (isOpen) return;
    setCurrentParentName(null);
    setSortMode(readSortMode(wallet.id));
    open();
  };

  const currentParentTag = tags.find((t) => t.name === currentParentName);
  const selectedTag = tags.find((t) => t.name === selectedTagName);
  const displayedTags = orderedTags.filter(
    (t) => (t.parentName || null) === currentParentName,
  );

  const isAncestorOfSelected = (tagName: string): boolean => {
    if (!selectedTagName) return false;
    let current: Tag | undefined = tags.find((t) => t.name === selectedTagName);
    while (current && current.parentName) {
      if (current.parentName === tagName) return true;
      current = tags.find((t) => t.name === current?.parentName);
    }
    return false;
  };

  const selectTag = (tagName: string) => {
    onSelectTag(tagName);
    close();
  };

  // Row click routing: a main category drills in; anything else selects.
  const handleRowClick = (tag: Tag, isParentHeader: boolean) => {
    const isMainCategory = !tag.parentName;
    if (isMainCategory && !isParentHeader) setCurrentParentName(tag.name);
    else selectTag(tag.name);
  };

  const emptyState = (message: string) => (
    <div className="rounded-lg border border-dashed border-app-border p-4 text-center text-sm italic text-app-muted">
      {message}
    </div>
  );

  // One picker row (leaf / category / drilled-in "General" header).
  const pickerRow = (tag: Tag, isParentHeader: boolean) => {
    const isSelected = tag.name === selectedTagName;
    const isAncestor = isAncestorOfSelected(tag.name);
    const isMainCategory = !tag.parentName;
    const trailing: TagRowTrailing | undefined =
      isMainCategory && !isParentHeader
        ? { kind: "drill", ancestor: isAncestor }
        : isSelected
          ? { kind: "check" }
          : undefined;
    return (
      <TagRow
        key={tag.name}
        tag={tag}
        color={color}
        hint={isParentHeader ? "General" : undefined}
        highlighted={isSelected || isAncestor}
        background={
          isSelected
            ? "selected"
            : isAncestor && !isParentHeader
              ? "tint"
              : "none"
        }
        onClick={() => handleRowClick(tag, isParentHeader)}
        trailing={trailing}
      />
    );
  };

  const list = () => {
    if (isSearching) {
      return filteredGroups.length > 0
        ? filteredGroups.map((group) => (
            <div key={group.main.name} className="mb-2">
              <div className="rounded-lg bg-app-hover">
                {pickerRow(group.main, true)}
              </div>
              {group.children.length > 0 && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-app-border/30 pl-2">
                  {group.children.map((child) => pickerRow(child, false))}
                </div>
              )}
            </div>
          ))
        : emptyState(`No tags found for "${searchQuery}".`);
    }

    return (
      <>
        {/* Drilled-in parent as a selectable "(General)" header. */}
        {currentParentName && currentParentTag && (
          <div className="mb-2">
            <div className="rounded-lg bg-app-hover">
              {pickerRow(currentParentTag, true)}
            </div>
            <hr className="mt-2 border-app-border" />
          </div>
        )}

        {displayedTags.length > 0
          ? displayedTags.map((tag) => pickerRow(tag, false))
          : emptyState(
              currentParentName ? "No subcategories found." : "No tags found.",
            )}

        {/* Categories are created / organized in the manager drawer. */}
        <div className="mt-2 border-t border-app-border pt-2">
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
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
      </>
    );
  };

  const backHeader =
    !isSearching && currentParentName && currentParentTag ? (
      <button
        type="button"
        onClick={() =>
          setCurrentParentName(currentParentTag.parentName || null)
        }
        className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-bold outline-none transition-colors hover:bg-app-input"
        style={{ color }}
      >
        <FontAwesomeIcon icon={faChevronLeft} />
        Back to{" "}
        {currentParentTag.parentName
          ? currentParentTag.parentName
          : "Categories"}
      </button>
    ) : null;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {showLabel && (
        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
          <FontAwesomeIcon icon={faHashtag} className="mr-2" /> Category *
        </label>
      )}

      {/* Trigger: labelled select showing the selected tag or a search input. */}
      <div
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-app-card px-4 text-left transition-all ${
          isOpen ? "" : "border-app-border"
        }`}
        style={
          isOpen
            ? {
                borderColor: color,
                boxShadow: `0 0 0 2px color-mix(in srgb, ${color} 20%, transparent)`,
              }
            : undefined
        }
        onClick={openPicker}
      >
        <div className="relative flex h-full flex-1 items-center overflow-hidden">
          {!isOpen && selectedTag ? (
            <div className="pointer-events-none flex w-full cursor-pointer items-center gap-3">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-input text-xs"
                style={{ color: selectedTag.colorHex || "#ffffff" }}
              >
                <Icon
                  icon={selectedTag.icon}
                  color={selectedTag.colorHex || "#ffffff"}
                />
              </div>
              <span className="truncate font-medium text-app-text">
                {selectedTag.name}
              </span>
            </div>
          ) : (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                openPicker();
              }}
              placeholder={isOpen ? "Tap to search..." : "Select a category..."}
              className="theme-bg-transparent h-full w-full font-medium text-app-text outline-none placeholder:text-app-muted"
            />
          )}
        </div>

        <button
          type="button"
          className="ml-2 flex h-full cursor-pointer items-center justify-center px-2 outline-none"
          onClick={(e) => {
            e.stopPropagation();
            if (isOpen) close();
            else openPicker();
          }}
        >
          <FontAwesomeIcon
            icon={isOpen ? faChevronUp : faChevronDown}
            className="text-app-muted transition-transform duration-300 hover:text-app-text"
          />
        </button>
      </div>

      {isOpen && (
        <TagDropdownPanel className="mt-1 w-full" headerSlot={backHeader}>
          {list()}
        </TagDropdownPanel>
      )}

      <CategoryManagerDrawer
        open={managerOpen}
        onClose={() => {
          setManagerOpen(false);
          setSortMode(readSortMode(wallet.id));
        }}
      />
    </div>
  );
};
