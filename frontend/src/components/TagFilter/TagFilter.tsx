import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import type { Tag } from "../../utils/types.ts";
import { Checkbox, type CheckboxState } from "../ui/Checkbox.tsx";
import { SearchInput } from "../ui/SearchInput.tsx";
import { TagRow } from "../TagSelector/TagRow.tsx";
import { TagDropdownPanel } from "../TagSelector/TagDropdownPanel.tsx";
import { useTagTree } from "../TagSelector/useTagTree.ts";

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  color?: string;
  onChange: (selectedTags: string[]) => void;
}

/**
 * Multi-select tag filter for the sticky transactions bar: a compact funnel
 * trigger opening an accordion of checkbox rows (tri-state "All", parent ->
 * children family selection, inline expand). Shares TagRow, the tree hook and
 * the dropdown panel with TagPicker.
 */
export const TagFilter: React.FC<TagFilterProps> = ({
  tags,
  selectedTags,
  color = "var(--color-app-green)",
  onChange,
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
    rootTags,
    getChildren,
    getFamily,
  } = useTagTree(tags);

  const [expandedNames, setExpandedNames] = useState<Set<string>>(
    () => new Set(),
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus the search field when the panel opens (no state writes here).
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  // Reset the accordion on each fresh open (avoids setState-in-effect on close).
  const openFilter = () => {
    if (isOpen) return;
    setExpandedNames(new Set());
    open();
  };

  const toggleExpand = (name: string) =>
    setExpandedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // --- Selection semantics ---
  let allState: CheckboxState = "unchecked";
  if (tags.length > 0 && selectedTags.length === tags.length) {
    allState = "checked";
  } else if (selectedTags.length > 0) {
    allState = "indeterminate";
  }

  const toggleAll = () =>
    onChange(allState === "checked" ? [] : tags.map((t) => t.name));

  // Toggling a parent toggles its whole family (parent + direct children).
  const toggleParent = (parentTag: Tag) => {
    const familyNames = getFamily(parentTag).map((t) => t.name);
    const isFullyChecked = familyNames.every((n) => selectedTags.includes(n));
    if (isFullyChecked) {
      onChange(selectedTags.filter((n) => !familyNames.includes(n)));
    } else {
      onChange(Array.from(new Set([...selectedTags, ...familyNames])));
    }
  };

  const toggleSingle = (tagName: string) =>
    onChange(
      selectedTags.includes(tagName)
        ? selectedTags.filter((n) => n !== tagName)
        : [...selectedTags, tagName],
    );

  const getParentState = (parentTag: Tag): CheckboxState => {
    const familyNames = getFamily(parentTag).map((t) => t.name);
    const checked = familyNames.filter((n) => selectedTags.includes(n)).length;
    if (checked === 0) return "unchecked";
    if (checked === familyNames.length) return "checked";
    return "indeterminate";
  };

  const childState = (childName: string): CheckboxState =>
    selectedTags.includes(childName) ? "checked" : "unchecked";

  const isFilterActive = selectedTags.length !== tags.length;

  const emptyState = (message: string) => (
    <div className="rounded-lg border border-dashed border-app-border p-4 text-center text-sm italic text-app-muted">
      {message}
    </div>
  );

  // A checkbox row for the accordion / search list.
  const filterRow = (
    tag: Tag,
    state: CheckboxState,
    onToggle: () => void,
    trailing?: { expanded: boolean; onToggle: () => void },
    onBodyClick?: () => void,
  ) => (
    <TagRow
      tag={tag}
      color={color}
      highlighted={state !== "unchecked"}
      background={state !== "unchecked" ? "active" : "none"}
      onClick={onBodyClick ?? onToggle}
      checkbox={{ state, onChange: onToggle }}
      trailing={
        trailing
          ? {
              kind: "expand",
              expanded: trailing.expanded,
              onToggle: trailing.onToggle,
            }
          : undefined
      }
    />
  );

  // Recursive accordion node: a row plus, when expanded, its indented children.
  const renderNode = (tag: Tag): React.ReactNode => {
    const children = getChildren(tag.name);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNames.has(tag.name);
    const state = hasChildren ? getParentState(tag) : childState(tag.name);
    const onToggle = () =>
      hasChildren ? toggleParent(tag) : toggleSingle(tag.name);
    return (
      <div key={tag.name}>
        {filterRow(
          tag,
          state,
          onToggle,
          hasChildren
            ? { expanded: isExpanded, onToggle: () => toggleExpand(tag.name) }
            : undefined,
          hasChildren ? () => toggleExpand(tag.name) : undefined,
        )}
        {hasChildren && isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-app-border/30 pl-2">
            {children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const list = () => {
    if (isSearching) {
      return filteredGroups.length > 0
        ? filteredGroups.map((group) => (
            <div key={group.main.name} className="mb-2">
              <div className="rounded-lg bg-app-hover">
                {filterRow(group.main, getParentState(group.main), () =>
                  toggleParent(group.main),
                )}
              </div>
              {group.children.length > 0 && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-app-border/30 pl-2">
                  {group.children.map((child) => (
                    <div key={child.name}>
                      {filterRow(child, childState(child.name), () =>
                        toggleSingle(child.name),
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        : emptyState(`No tags found for "${searchQuery}".`);
    }

    return (
      <>
        <Checkbox
          state={allState}
          onChange={toggleAll}
          label="All Tags"
          color={color}
          aria-label="Toggle all tags"
          className="w-full rounded-lg p-3 hover:bg-app-input"
        />
        <hr className="my-1 border-app-border" />
        {rootTags.length > 0
          ? rootTags.map((rootTag) => renderNode(rootTag))
          : emptyState("No tags available.")}
      </>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger: compact funnel button with an active accent + dot. */}
      <button
        type="button"
        onClick={() => (isOpen ? close() : openFilter())}
        className={`flex h-[48px] w-[48px] items-center justify-center rounded-xl border transition-all ${
          isFilterActive || isOpen
            ? "shadow-lg"
            : "bg-app-input border-app-border text-app-muted hover:bg-app-surface hover:text-app-text"
        }`}
        style={
          isFilterActive || isOpen
            ? {
                backgroundColor: color + "26",
                color: color,
                borderColor: color + "40",
              }
            : {}
        }
        title="Filter by Tags"
      >
        <div className="relative">
          <FontAwesomeIcon
            icon={faFilter}
            className="text-lg transition-transform hover:scale-110"
          />
          {isFilterActive && (
            <div
              className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            ></div>
          )}
        </div>
      </button>

      {isOpen && (
        <TagDropdownPanel
          className="right-0 mt-4 w-72"
          searchSlot={
            <SearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChange={setSearchQuery}
              color={color}
              placeholder="Search tags..."
              aria-label="Search tags"
            />
          }
        >
          {list()}
        </TagDropdownPanel>
      )}
    </div>
  );
};
