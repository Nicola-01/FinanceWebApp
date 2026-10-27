import React from "react";
import { DragOverlay } from "@dnd-kit/core";
import type { Tag } from "../../types/domain.ts";
import type { TagTreeNode } from "../../utils/tagOrder.ts";
import { Badge } from "../../components/ui/Badge";
import { Icon } from "../../components/icon/Icon.tsx";

/** Floating preview of the dragged parent block (with up to 4 children) or child. */
export const CategoryDragOverlay: React.FC<{
  activeNode: TagTreeNode | null;
  activeChild: Tag | null;
}> = ({ activeNode, activeChild }) => (
  <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
    {activeNode ? (
      <div className="overflow-hidden rounded-xl bg-app-card shadow-2xl ring-1 ring-app-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-app-input"
            style={{ color: activeNode.parent.colorHex }}
          >
            <Icon
              icon={activeNode.parent.icon}
              color={activeNode.parent.colorHex}
            />
          </div>
          <span className="text-sm font-bold text-app-text">
            {activeNode.parent.name}
          </span>
          <Badge variant="subtle" mono className="ml-auto">
            {activeNode.children.length}
          </Badge>
        </div>
        {activeNode.children.length > 0 && (
          <div className="ml-5 flex flex-col gap-1 border-l border-app-border pb-2 pl-2 pr-2">
            {activeNode.children.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center gap-2 px-1 py-0.5">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-md bg-app-input text-xs"
                  style={{ color: c.colorHex }}
                >
                  <Icon icon={c.icon} color={c.colorHex} />
                </div>
                <span className="truncate text-xs font-medium text-app-text">
                  {c.name}
                </span>
              </div>
            ))}
            {activeNode.children.length > 4 && (
              <span className="pl-1 text-[11px] italic text-app-muted">
                +{activeNode.children.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    ) : activeChild ? (
      <div className="flex items-center gap-2 rounded-lg bg-app-card px-3 py-2 shadow-2xl ring-1 ring-app-border">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-app-input"
          style={{ color: activeChild.colorHex }}
        >
          <Icon icon={activeChild.icon} color={activeChild.colorHex} />
        </div>
        <span className="text-sm font-medium text-app-text">
          {activeChild.name}
        </span>
      </div>
    ) : null}
  </DragOverlay>
);
