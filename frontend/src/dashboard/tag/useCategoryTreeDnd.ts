import React, { useRef, useState } from "react";
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Tag } from "../../types/domain.ts";
import {
  applyTagOrder,
  persistTree,
  type TagTreeNode,
} from "../../utils/tagOrder.ts";
import {
  buildChildParent,
  CONTAINER_PREFIX,
  moveChildToParent,
  resolveTargetParent,
} from "./categoryDnd.ts";

interface UseCategoryTreeDndArgs {
  walletId: string;
  tags: Tag[];
  tree: TagTreeNode[];
  setTree: React.Dispatch<React.SetStateAction<TagTreeNode[]>>;
  handleUpdateTag: (oldName: string, updated: Partial<Tag>) => Promise<boolean>;
}

/**
 * Drag state machine for the category tree: reorder parents, reorder children,
 * and reparent a child (live while dragging, persisted to the backend on drop).
 * Order is persisted client-side via utils/tagOrder.
 */
export function useCategoryTreeDnd({
  walletId,
  tags,
  tree,
  setTree,
  handleUpdateTag,
}: UseCategoryTreeDndArgs) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overParent, setOverParent] = useState<string | null>(null);

  // The child's parent when a drag started (to know whether it was reparented),
  // and a snapshot of the tree to restore on cancel. Live cross-container moves
  // in onDragOver mutate `tree` directly, so these ride out the whole gesture.
  const dragOriginParent = useRef<string | null>(null);
  const treeBeforeDrag = useRef<TagTreeNode[] | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const rootNames = new Set(tree.map((n) => n.parent.name));
  const childParent = buildChildParent(tree);

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setActiveId(id);
    setOverParent(null);
    dragOriginParent.current = childParent[id] ?? null;
    treeBeforeDrag.current = tree;
    // A parent about to move should not stay expanded over the drop zone; keep
    // the drag focused on the block itself.
  };

  // While dragging a CHILD, move it between parents live so the target opens a
  // gap (and reparenting feels continuous). Same-container fine-ordering is left
  // to the sortable strategy and finalized in onDragEnd.
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    const activeName = String(active.id);
    const sourceParent = childParent[activeName];
    if (!sourceParent) return; // parent drags don't cross containers
    if (!over) {
      setOverParent(null);
      return;
    }
    const overId = String(over.id);
    const targetParent = resolveTargetParent(overId, rootNames, childParent);
    setOverParent(targetParent);
    if (!targetParent || targetParent === sourceParent) return;

    setTree((prev) => {
      const tgt = prev.find((n) => n.parent.name === targetParent);
      // Insert relative to the hovered child (before/after by its mid-line),
      // else append at the end of the target.
      let newIndex = tgt?.children.length ?? 0;
      const overIdx = tgt?.children.findIndex((c) => c.name === overId) ?? -1;
      if (overIdx >= 0) {
        const overRect = over.rect;
        const activeTop = active.rect.current.translated?.top;
        const isBelow =
          activeTop != null && activeTop > overRect.top + overRect.height / 2;
        newIndex = overIdx + (isBelow ? 1 : 0);
      }
      return moveChildToParent(
        prev,
        activeName,
        sourceParent,
        targetParent,
        newIndex,
      );
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeName = String(active.id);
    const originParent = dragOriginParent.current;
    const before = treeBeforeDrag.current;
    setActiveId(null);
    setOverParent(null);
    dragOriginParent.current = null;
    treeBeforeDrag.current = null;

    if (!over) {
      // Dropped nowhere: undo any live cross-container move.
      if (before) {
        setTree(before);
        persistTree(walletId, before);
      }
      return;
    }
    const overId = String(over.id);

    // --- dragging a parent: reorder roots only ---
    if (rootNames.has(activeName)) {
      const overRoot = resolveTargetParent(overId, rootNames, childParent);
      if (!overRoot || overRoot === activeName) return;
      const oldIndex = tree.findIndex((n) => n.parent.name === activeName);
      const newIndex = tree.findIndex((n) => n.parent.name === overRoot);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(tree, oldIndex, newIndex);
      setTree(next);
      persistTree(walletId, next);
      return;
    }

    // --- dragging a child: finalize position within its (current) parent ---
    // onDragOver has already applied any reparent, so `childParent` is current.
    const currentParent = childParent[activeName];
    if (!currentParent) {
      if (before) {
        setTree(before);
        persistTree(walletId, before);
      }
      return;
    }
    const node = tree.find((n) => n.parent.name === currentParent);
    if (!node) return;
    const oldIdx = node.children.findIndex((c) => c.name === activeName);
    let newIdx = oldIdx;
    if (!overId.startsWith(CONTAINER_PREFIX) && !rootNames.has(overId)) {
      const oi = node.children.findIndex((c) => c.name === overId);
      if (oi >= 0) newIdx = oi;
    }

    let next = tree;
    if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
      const reordered = arrayMove(node.children, oldIdx, newIdx);
      next = tree.map((n) =>
        n.parent.name === currentParent ? { ...n, children: reordered } : n,
      );
      setTree(next);
    }
    persistTree(walletId, next);

    // Persist a reparent to the backend (order already saved locally above).
    if (originParent && originParent !== currentParent) {
      const moved = next
        .find((n) => n.parent.name === currentParent)
        ?.children.find((c) => c.name === activeName);
      if (moved) {
        void handleUpdateTag(activeName, {
          ...moved,
          parentName: currentParent,
        }).then((ok) => {
          if (!ok) {
            // Backend rejected the move: fall back to a store-consistent tree.
            const reverted = applyTagOrder(walletId, tags);
            setTree(reverted);
            persistTree(walletId, reverted);
          }
        });
      }
    }
  };

  const handleDragCancel = () => {
    const before = treeBeforeDrag.current;
    treeBeforeDrag.current = null;
    dragOriginParent.current = null;
    setActiveId(null);
    setOverParent(null);
    if (before) setTree(before);
  };

  const activeIsChild = activeId != null && childParent[activeId] != null;
  const activeNode: TagTreeNode | null = activeId
    ? (tree.find((n) => n.parent.name === activeId) ?? null)
    : null;
  const activeChild: Tag | null =
    activeId && !activeNode
      ? (tree.flatMap((n) => n.children).find((c) => c.name === activeId) ??
        null)
      : null;

  return {
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    overParent,
    activeIsChild,
    activeNode,
    activeChild,
  };
}
