import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
} from "@dnd-kit/core";

export const MERGE_PREFIX = "merge:";
export const MEMBER_PREFIX = "member:";
export const GROUPBODY_PREFIX = "groupbody:";

/** Sortable id for a group member tile: `member:<groupId>:<widgetId>`. */
export const memberId = (groupId: string, widgetId: string) =>
  `${MEMBER_PREFIX}${groupId}:${widgetId}`;

/** Droppable id marking "the pointer is still inside this group's body". */
export const groupBodyId = (groupId: string) => `${GROUPBODY_PREFIX}${groupId}`;

/**
 * Parse a `member:<groupId>:<widgetId>` id. `groupId` is always `group-<n>` and
 * `widgetId` never contains a colon, so a 3-part split is unambiguous.
 */
export function parseMemberId(
  id: string,
): { groupId: string; widgetId: string } | null {
  if (!id.startsWith(MEMBER_PREFIX)) return null;
  const [, groupId, widgetId] = id.split(":");
  if (!groupId || !widgetId) return null;
  return { groupId, widgetId };
}

/** A real grid slot (not a merge zone, member tile, or group-body droppable). */
export const isSlotId = (id: string) =>
  !id.startsWith(MERGE_PREFIX) &&
  !id.startsWith(MEMBER_PREFIX) &&
  !id.startsWith(GROUPBODY_PREFIX);

/**
 * One collision strategy shared by two kinds of drag in the same DndContext.
 *
 * **Slot drag** (active id is a slot id): merge zones win when the pointer is
 * inside one (drop-on-center = group); otherwise fall back to closest-center
 * among the real slots (reorder). Only valid targets render a merge zone, so
 * span rules are enforced by construction. While the pointer is inside a valid
 * merge target's card but outside its central merge zone, report NO collision:
 * closest-center would otherwise fire a live reorder swap before the pointer
 * can reach the merge zone, sweeping the target to the other side (an
 * unreachable "dead band"). Suppressing reorder inside the target keeps it
 * still so drop-on-center grouping is reachable; reordering still works by
 * crossing the gap midpoint or dragging past the card.
 *
 * **Member drag** (active id is `member:<g>:<w>`): prioritise sibling member
 * tiles of the same group (in-group reorder), then that group's body (stay in
 * group), else closest-center over SLOT ids only (pop out to a standalone card
 * at that position). A member never targets a merge zone or a foreign group, so
 * dropping outside its own group always pops to a standalone slot.
 */
export const mergeAwareCollision: CollisionDetection = (args) => {
  const activeMember = parseMemberId(String(args.active.id));

  // --- Member-tile drag: reorder among siblings, or pop out over a slot. ---
  if (activeMember) {
    const { groupId } = activeMember;
    const within = pointerWithin(args);

    // 1) Sibling member tiles of the same group win (in-group reorder).
    const siblings = within.filter((c) => {
      const m = parseMemberId(String(c.id));
      return m !== null && m.groupId === groupId;
    });
    if (siblings.length > 0) return siblings;

    // 2) Still inside the same group's body → keep it (reorder to end / no-op).
    const body = within.filter((c) => String(c.id) === groupBodyId(groupId));
    if (body.length > 0) return body;

    // 3) Otherwise pop out: closest SLOT only — never a merge/member/groupbody.
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) =>
        isSlotId(String(c.id)),
      ),
    });
  }

  // --- Slot drag: merge zones win, else closest-center reorder over slots. ---
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
    droppableContainers: args.droppableContainers.filter((c) =>
      isSlotId(String(c.id)),
    ),
  });
};
