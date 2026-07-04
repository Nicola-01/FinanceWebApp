import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from "@dnd-kit/core";

export const MERGE_PREFIX = "merge:";

/**
 * Merge zones win when the pointer is inside one (drop-on-center = group);
 * otherwise fall back to closest-center among the real slots (reorder).
 * Only valid targets render a merge zone, so span rules are enforced by
 * construction.
 *
 * While the pointer is inside a valid merge target's card but outside its
 * central merge zone, report NO collision: closest-center would otherwise
 * fire a live reorder swap before the pointer can reach the merge zone,
 * sweeping the target to the other side (an unreachable "dead band" for
 * slow, deliberate drags). Suppressing reorder inside the target keeps it
 * still so drop-on-center grouping is reachable; reordering still works by
 * crossing the gap midpoint or dragging past the card.
 */
export const mergeAwareCollision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  const zones = within.filter((c) => String(c.id).startsWith(MERGE_PREFIX));
  if (zones.length > 0) return zones;

  // Disabled droppables are already excluded, so any registered merge zone
  // marks its slot as a currently-valid merge target.
  const mergeTargetIds = new Set(
    args.droppableContainers
      .map((c) => String(c.id))
      .filter((id) => id.startsWith(MERGE_PREFIX))
      .map((id) => id.slice(MERGE_PREFIX.length)),
  );
  if (within.some((c) => mergeTargetIds.has(String(c.id)))) return [];

  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (c) => !String(c.id).startsWith(MERGE_PREFIX),
    ),
  });
};
