import React, { lazy, Suspense } from "react";

export interface TagDropdownPanelProps {
  /** The wrapper element that holds the trigger; the panel is positioned against it. */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Called on Escape or outside press. */
  onClose: () => void;
  /** Horizontal alignment against the anchor. Default "start". */
  align?: "start" | "end";
  /** Width utilities only, e.g. "w-72". */
  className?: string;
  /** Optional search field pinned at the top (filter mode). */
  searchSlot?: React.ReactNode;
  /** Optional back header pinned under the search (picker drill). */
  headerSlot?: React.ReactNode;
  /** Scrollable list body. */
  children: React.ReactNode;
}

// Lazy boundary: keeps Base UI Popover out of the main chunk (the PWA precache limit).
const TagDropdownPopover = lazy(() =>
  import("./TagDropdownPopover.tsx").then((m) => ({
    default: m.TagDropdownPopover,
  })),
);

/**
 * Shared floating card for both tag dropdowns: the bordered panel, an optional
 * pinned search field, an optional pinned back header, and the scrollable list.
 * Rendered through a Base UI Popover so it flips/shifts to stay on screen.
 */
export const TagDropdownPanel: React.FC<TagDropdownPanelProps> = (props) => (
  <Suspense fallback={null}>
    <TagDropdownPopover {...props} />
  </Suspense>
);
