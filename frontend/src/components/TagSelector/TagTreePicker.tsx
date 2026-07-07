import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronUp,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../utils/types";
import { Icon } from "../icon/Icon.tsx";
import { TagRow, type TagRowTrailing } from "./TagRow.tsx";
import { TagDropdownPanel } from "./TagDropdownPanel.tsx";
import { useTagTree } from "./useTagTree.ts";

export interface TagTreePickerProps {
  /** Flat tag list, already in display order; `parentName` links the tree. */
  tags: Tag[];
  /** Accent colour for the trigger focus, selection and ancestor tint. */
  color?: string;
  selectedTagName: string;
  onSelectTag: (tagName: string) => void;
  showLabel?: boolean;
  /** Called on each fresh open (e.g. to re-read a persisted sort order). */
  onOpen?: () => void;
  /**
   * Pinned at the bottom of the dropdown list (e.g. a "Manage categories"
   * button). Receives the currently drilled-in parent for deep-linking.
   */
  footerSlot?: (ctx: { currentParentName: string | null }) => React.ReactNode;
  /** Rendered inside the picker's root container (e.g. a manager drawer). */
  children?: React.ReactNode;
}

/**
 * Context-free single-select category picker: a labelled select trigger opening
 * a drill-down tag tree with search. Selection is shown by highlighting the row
 * (no checkbox). It only knows the tags it is given — wallet-aware concerns
 * (usage-based ordering, the category manager) are layered on by {@link TagPicker};
 * the wallet-creation wizard uses it directly with the staged tags.
 */
export const TagTreePicker: React.FC<TagTreePickerProps> = ({
  tags,
  color = "var(--color-app-green)",
  selectedTagName,
  onSelectTag,
  showLabel = true,
  onOpen,
  footerSlot,
  children,
}) => {
  const {
    isOpen,
    open,
    close,
    dropdownRef,
    searchQuery,
    setSearchQuery,
    isSearching,
    filteredGroups,
  } = useTagTree(tags);

  const [currentParentName, setCurrentParentName] = useState<string | null>(
    null,
  );

  // Reset the drill (and let the owner refresh ordering) on each fresh open.
  const openPicker = () => {
    if (isOpen) return;
    setCurrentParentName(null);
    onOpen?.();
    open();
  };

  const currentParentTag = tags.find((t) => t.name === currentParentName);
  const selectedTag = tags.find((t) => t.name === selectedTagName);
  const displayedTags = tags.filter(
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

        {footerSlot?.({ currentParentName })}
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
          {isOpen ? (
            // Search input only exists while open, and is NOT auto-focused: on
            // mobile the keyboard stays down until the user taps ("Tap to search").
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                openPicker();
              }}
              placeholder="Tap to search..."
              className="h-full w-full bg-transparent font-medium text-app-text outline-none placeholder:text-app-muted"
            />
          ) : selectedTag ? (
            <div className="pointer-events-none flex w-full cursor-pointer items-center gap-3">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-input text-xs"
                style={{
                  color: selectedTag.colorHex || "var(--color-app-text)",
                }}
              >
                <Icon
                  icon={selectedTag.icon}
                  color={selectedTag.colorHex || "var(--color-app-text)"}
                />
              </div>
              <span className="truncate font-medium text-app-text">
                {selectedTag.name}
              </span>
            </div>
          ) : (
            // Closed + no selection: a plain (non-focusable) placeholder so tapping
            // it just opens the dropdown instead of focusing an input.
            <span className="cursor-pointer truncate font-medium text-app-muted">
              Select a category...
            </span>
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

      {children}
    </div>
  );
};
