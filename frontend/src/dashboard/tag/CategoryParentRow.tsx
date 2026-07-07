import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "../../components/ui/Badge";
import {
  faChevronRight,
  faGripVertical,
  faPenToSquare,
  faReceipt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Tag } from "../../utils/types.ts";
import { IconPickerButton } from "../../components/icon/IconPickerButton.tsx";
import { useInlineTagEdit } from "./useInlineTagEdit.ts";

interface CategoryParentRowProps {
  parent: Tag;
  childCount: number;
  /** Transactions tagged with this category or any of its children. */
  occurrences?: number;
  expanded: boolean;
  onToggleExpand: () => void;
  readOnly?: boolean;
  /** Whether reordering is available (false when the tree is auto-sorted). */
  draggable?: boolean;
  /** Highlight the whole block as the current reparent target for a dragged child. */
  isDropTarget?: boolean;
  onUpdateTag: (oldName: string, updated: Partial<Tag>) => Promise<boolean>;
  onRequestDelete: (tag: Tag) => void;
  /** The expandable sub-tree; rendered inside the sortable node so it travels with the parent. */
  children?: React.ReactNode;
}

/**
 * One main-category block: drag handle + expander + icon + name + count + actions,
 * followed by its (expandable) sub-tree. The **whole block** is the sortable node,
 * so reordering a parent carries its children and shifts sibling blocks as units.
 */
export const CategoryParentRow: React.FC<CategoryParentRowProps> = ({
  parent,
  childCount,
  occurrences = 0,
  expanded,
  onToggleExpand,
  readOnly = false,
  draggable = true,
  isDropTarget = false,
  onUpdateTag,
  onRequestDelete,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parent.name });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    // Highlight the block in the destination parent's own colour while a child
    // is being dragged into it (tinted fill + a ring in that colour).
    ...(isDropTarget
      ? {
          backgroundColor: `${parent.colorHex}14`,
          boxShadow: `inset 0 0 0 1.5px ${parent.colorHex}`,
        }
      : {}),
  };

  const edit = useInlineTagEdit(parent, onUpdateTag, readOnly);

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl">
      <div className="group/parent flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-app-input">
        {!readOnly && draggable && (
          <button
            type="button"
            aria-label={`Reorder ${parent.name}`}
            className="shrink-0 cursor-grab touch-none px-0.5 text-app-muted/40 transition-colors hover:text-app-muted active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <FontAwesomeIcon icon={faGripVertical} className="text-sm" />
          </button>
        )}

        <button
          type="button"
          aria-label={
            expanded ? `Collapse ${parent.name}` : `Expand ${parent.name}`
          }
          aria-expanded={expanded}
          onClick={onToggleExpand}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-surface"
        >
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`text-xs transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>

        <IconPickerButton
          icon={edit.displayIcon}
          color={edit.displayColor}
          onIconChange={edit.setIconVal}
          onColorChange={edit.setColorVal}
          isOpen={edit.iconOpen}
          onToggle={edit.onIconToggle}
        />

        {edit.isEditing ? (
          <input
            autoFocus
            value={edit.nameVal}
            onChange={(e) => edit.setNameVal(e.target.value)}
            onBlur={edit.commitName}
            onKeyDown={edit.nameKeyDown}
            className="min-w-0 flex-1 rounded-lg border border-app-green/50 bg-app-input px-2.5 py-1 text-sm font-bold text-app-text outline-none transition-colors focus:border-app-green focus:ring-2 focus:ring-app-green/20"
          />
        ) : (
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-base font-bold text-app-text"
            onClick={onToggleExpand}
            onDoubleClick={edit.startEditing}
          >
            {parent.name}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-1.5 text-app-muted">
          {occurrences > 0 && (
            <span
              title={`${occurrences} transaction${occurrences === 1 ? "" : "s"}`}
              className="flex items-center gap-1 font-app-mono text-[11px] tabular-nums"
            >
              <FontAwesomeIcon
                icon={faReceipt}
                className="text-[9px] opacity-60"
              />
              {occurrences}
            </span>
          )}
          <Badge
            variant="subtle"
            mono
            title={`${childCount} sub-categor${childCount === 1 ? "y" : "ies"}`}
          >
            {childCount}
          </Badge>
        </div>

        {!readOnly && !edit.isEditing && (
          <div className="flex shrink-0 items-center gap-1 opacity-40 transition-opacity group-hover/parent:opacity-100">
            <button
              type="button"
              aria-label={`Rename ${parent.name}`}
              onClick={edit.startEditing}
              className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-input hover:text-app-yellow"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
            </button>
            <button
              type="button"
              aria-label={`Delete ${parent.name}`}
              onClick={() => onRequestDelete(parent)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition-colors hover:bg-app-red/10 hover:text-app-red"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
