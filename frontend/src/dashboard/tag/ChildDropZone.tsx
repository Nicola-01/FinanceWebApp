import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { CONTAINER_PREFIX } from "./categoryDnd.ts";

/** A drop target for reparenting a child into an empty (childless) parent. */
export const ChildDropZone: React.FC<{ parentName: string; color: string }> = ({
  parentName,
  color,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${CONTAINER_PREFIX}${parentName}`,
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-dashed px-3 py-2 text-xs italic transition-colors ${
        isOver ? "" : "border-app-border text-app-muted/60"
      }`}
      style={
        isOver
          ? { borderColor: color, backgroundColor: `${color}14`, color }
          : undefined
      }
    >
      Drop a sub-category here
    </div>
  );
};
