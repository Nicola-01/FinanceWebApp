import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Tag } from "../../utils/types.ts";

export interface TagTreeSearchGroup {
  main: Tag;
  children: Tag[];
}

/**
 * Shared dropdown + tag-tree state for TagFilter and TagPicker: open/close with
 * click-outside, the search query with grouped results, and the pure tree
 * helpers. Navigation state (accordion expansion vs drill) and selection live in
 * each component, since those are exactly where the two intentionally differ.
 */
export function useTagTree(tags: Tag[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  const rootTags = useMemo(() => tags.filter((t) => !t.parentName), [tags]);

  const getChildren = useCallback(
    (parentName: string) => tags.filter((t) => t.parentName === parentName),
    [tags],
  );

  const getFamily = useCallback(
    (parentTag: Tag): Tag[] => [
      parentTag,
      ...tags.filter((t) => t.parentName === parentTag.name),
    ],
    [tags],
  );

  const isSearching = searchQuery.trim().length > 0;

  const filteredGroups = useMemo<TagTreeSearchGroup[]>(() => {
    const lowerQuery = searchQuery.toLowerCase();
    if (!lowerQuery.trim()) return [];
    const groups: TagTreeSearchGroup[] = [];
    rootTags.forEach((main) => {
      const isMainMatch = main.name.toLowerCase().includes(lowerQuery);
      const matchingChildren = tags.filter(
        (t) =>
          t.parentName === main.name &&
          t.name.toLowerCase().includes(lowerQuery),
      );
      if (isMainMatch || matchingChildren.length > 0) {
        groups.push({ main, children: matchingChildren });
      }
    });
    return groups;
  }, [searchQuery, rootTags, tags]);

  return {
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
  };
}
