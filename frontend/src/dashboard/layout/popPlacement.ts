/**
 * Pure geometry for the member pop-out placeholder.
 *
 * When a group member is dragged OUT to a standalone card, the grid index it
 * would pop into must be computed from a FROZEN snapshot of the slot rects
 * (captured at drag start), never from the live grid. Inserting the dashed
 * placeholder reflows the live grid, so reading live rects makes the computed
 * index depend on the placeholder it drives — a feedback loop that oscillates
 * the placeholder against the card already at that position (the "flicker").
 *
 * Against a fixed snapshot the index is a pure, monotonic step function of the
 * pointer, so it can't oscillate and the drop lands exactly where the preview
 * showed. Coordinates are whatever space the caller measures in (this module
 * uses document coords so it survives scrolling mid-drag).
 */

/** Axis-aligned rectangle in the caller's coordinate space. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** True when point (x, y) is inside `box` (bounds inclusive). */
export function boxContains(box: Box, x: number, y: number): boolean {
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
}

/**
 * Reading-order insertion index (0..boxes.length) for a point among fixed slot
 * boxes laid out by CSS grid auto-flow (row by row, left to right). A slot
 * counts as "before" the point when the point sits on a lower row (past the
 * slot's bottom) or on the slot's own row but past its horizontal centre —
 * generalising the single-`over` before/after test to every slot at once.
 *
 * `boxes` MUST be in slot (display) order; the returned value is the number of
 * slots the point has moved past, i.e. where a new standalone slot is inserted.
 */
export function popInsertionIndex(boxes: Box[], x: number, y: number): number {
  let index = 0;
  for (const b of boxes) {
    const centreX = (b.left + b.right) / 2;
    const onLowerRow = y > b.bottom;
    const onThisRow = y >= b.top && y <= b.bottom;
    if (onLowerRow || (onThisRow && x > centreX)) index += 1;
  }
  return index;
}
