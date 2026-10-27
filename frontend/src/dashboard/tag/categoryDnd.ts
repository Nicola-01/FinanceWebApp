import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from "@dnd-kit/core";
import type { Tag } from "../../types/domain.ts";
import type { TagTreeNode } from "../../utils/tagOrder.ts";

/** Droppable-id prefix of a parent's (empty-children) drop zone. */
export const CONTAINER_PREFIX = "container:";

/**
 * Prefer the most specific droppable under the pointer. Our parent blocks are big
 * droppables that fully contain their child rows and drop zones; plain
 * `closestCenter` over all droppables would let a tall block win over the small
 * row the pointer is actually on. So: restrict `closestCenter` to the droppables
 * the pointer is within, falling back to the global result when it's outside all.
 */
export const nestedCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    const hitIds = new Set(pointerHits.map((h) => h.id));
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) =>
        hitIds.has(c.id),
      ),
    });
  }
  return closestCenter(args);
};

/** Map each child name to the name of its parent. */
export function buildChildParent(tree: TagTreeNode[]): Record<string, string> {
  const childParent: Record<string, string> = {};
  tree.forEach((n) =>
    n.children.forEach((c) => {
      childParent[c.name] = n.parent.name;
    }),
  );
  return childParent;
}

/**
 * Map any drop target id (child name, parent name, or container:<parent>) to
 * the parent it belongs to.
 */
export function resolveTargetParent(
  overId: string,
  rootNames: Set<string>,
  childParent: Record<string, string>,
): string | null {
  if (overId.startsWith(CONTAINER_PREFIX))
    return overId.slice(CONTAINER_PREFIX.length);
  if (rootNames.has(overId)) return overId;
  return childParent[overId] ?? null;
}

/**
 * Move child `childName` from `sourceParent` into `targetParent` at `newIndex`
 * (re-pointing its `parentName`). Returns `tree` unchanged when either parent
 * or the child is missing.
 */
export function moveChildToParent(
  tree: TagTreeNode[],
  childName: string,
  sourceParent: string,
  targetParent: string,
  newIndex: number,
): TagTreeNode[] {
  const src = tree.find((n) => n.parent.name === sourceParent);
  const tgt = tree.find((n) => n.parent.name === targetParent);
  if (!src || !tgt) return tree;
  const child = src.children.find((c) => c.name === childName);
  if (!child) return tree;

  const moved: Tag = { ...child, parentName: targetParent };
  return tree.map((n) => {
    if (n.parent.name === sourceParent)
      return {
        ...n,
        children: src.children.filter((c) => c.name !== childName),
      };
    if (n.parent.name === targetParent)
      return {
        ...n,
        children: [
          ...tgt.children.slice(0, newIndex),
          moved,
          ...tgt.children.slice(newIndex),
        ],
      };
    return n;
  });
}
