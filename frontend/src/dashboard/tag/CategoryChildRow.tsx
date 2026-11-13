import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTurnUp,
  faGripVertical,
  faPenToSquare,
  faReceipt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Tag } from "../../types/domain.ts";
import { IconPickerButton } from "../../components/icon/IconPickerButton.tsx";
import { SyncStateIcon } from "../../components/ui/SyncStateIcon.tsx";
import { useInlineTagEdit } from "./useInlineTagEdit.ts";
import { Input } from "../../components/ui/Input.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

interface CategoryChildRowProps {
  child: Tag;
  readOnly?: boolean;
  /** Whether reordering is available (false when the tree is auto-sorted). */
  draggable?: boolean;
  /** Transactions tagged with this sub-category. */
  occurrences?: number;
  onUpdateTag: (oldName: string, updated: Partial<Tag>) => Promise<boolean>;
  onRequestDelete: (tag: Tag) => void;
}

/** One sub-category row: connector + drag handle + icon + inline name + actions. */
export const CategoryChildRow: React.FC<CategoryChildRowProps> = ({
  child,
  readOnly = false,
  draggable = true,
  occurrences = 0,
  onUpdateTag,
  onRequestDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: child.name });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const edit = useInlineTagEdit(child, onUpdateTag, readOnly);
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/child flex items-center gap-2 rounded-lg p-2 pl-1 transition-colors ${v2 ? "hover:bg-app-raised" : "hover:bg-app-input"}`}
    >
      <FontAwesomeIcon
        icon={faArrowTurnUp}
        className="shrink-0 rotate-90 text-xs text-app-muted/30"
      />

      {!readOnly && draggable && (
        <button
          type="button"
          aria-label={`Reorder ${child.name}`}
          className={`shrink-0 cursor-grab touch-none px-0.5 transition-colors active:cursor-grabbing ${v2 ? "text-app-faint hover:text-app-muted" : "text-app-muted/40 hover:text-app-muted"}`}
          {...attributes}
          {...listeners}
        >
          <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
        </button>
      )}

      <IconPickerButton
        size="sm"
        icon={edit.displayIcon}
        color={edit.displayColor}
        onIconChange={edit.setIconVal}
        onColorChange={edit.setColorVal}
        isOpen={edit.iconOpen}
        onToggle={edit.onIconToggle}
      />

      {edit.isEditing ? (
        v2 ? ( // ui-v2-switch
          <div className="min-w-0 flex-1">
            <Input
              inputSize="sm"
              autoFocus
              value={edit.nameVal}
              onChange={(e) => edit.setNameVal(e.target.value)}
              onBlur={edit.commitName}
              onKeyDown={edit.nameKeyDown}
            />
          </div>
        ) : (
          <input
            autoFocus
            value={edit.nameVal}
            onChange={(e) => edit.setNameVal(e.target.value)}
            onBlur={edit.commitName}
            onKeyDown={edit.nameKeyDown}
            className="min-w-0 flex-1 rounded-lg border border-app-green/50 bg-app-input px-2.5 py-0.5 text-sm text-app-text outline-none transition-colors focus:border-app-green focus:ring-2 focus:ring-app-green/20"
          />
        )
      ) : (
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium text-app-text"
          onDoubleClick={edit.startEditing}
        >
          {child.name}
        </span>
      )}

      <SyncStateIcon state={child.syncState} />

      {occurrences > 0 && (
        <span
          title={`${occurrences} transaction${occurrences === 1 ? "" : "s"}`}
          className={`flex shrink-0 items-center gap-1 tabular-nums text-app-muted ${v2 ? "text-[12px]" : "font-app-mono text-[11px]"}`}
        >
          <FontAwesomeIcon icon={faReceipt} className="text-[9px] opacity-60" />
          {occurrences}
        </span>
      )}

      {!readOnly && !edit.isEditing && (
        <div className="flex shrink-0 items-center gap-1 opacity-40 transition-opacity group-hover/child:opacity-100">
          <button
            type="button"
            aria-label={`Rename ${child.name}`}
            onClick={edit.startEditing}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition-colors ${v2 ? "hover:bg-app-raised hover:text-app-text" : "hover:bg-app-input hover:text-app-yellow"}`}
          >
            <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${child.name}`}
            onClick={() => onRequestDelete(child)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition-colors ${v2 ? "hover:bg-app-raised hover:text-app-danger" : "hover:bg-app-red/10 hover:text-app-red"}`}
          >
            <FontAwesomeIcon icon={faTrash} className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
};
