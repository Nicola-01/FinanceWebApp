/**
 * Pure geometry for the whole-card (slot) reorder placeholder.
 *
 * dnd-kit's `rectSortingStrategy` previews a reorder by permuting the measured
 * rects — it assigns the dragged card the *position* of the card it displaces,
 * blind to column span. So a full-span card dropped onto a half-span row gets
 * squeezed into a half slot (it overlaps its neighbour). Instead we compute the
 * insertion index geometrically from a frozen snapshot and let CSS grid flow the
 * result, which honours the span (a full card always takes a whole row).
 *
 * The index is computed over the OTHER slots (the dragged card excluded), so the
 * value is a ready-to-use insertion index into the list-without-the-active-card
 * (see `moveSlotToIndex`). Coordinates are the caller's space (document coords).
 */

import { popInsertionIndex, type Box } from "./popPlacement";

/** A run of boxes sharing a grid row, with the row's vertical extent. */
export interface SlotRow {
  /** First box index in the row (into the passed `boxes`). */
  start: number;
  /** Last box index in the row. */
  end: number;
  top: number;
  bottom: number;
}

/**
 * Cluster boxes (in display order) into grid rows. A box opens a new row when it
 * starts at/below the current row's bottom (no real vertical overlap) — crisp
 * because grid rows are gap-separated.
 */
export function slotRows(boxes: Box[]): SlotRow[] {
  const rows: SlotRow[] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    const b = boxes[i];
    const cur = rows[rows.length - 1];
    if (cur && b.top < cur.bottom - 1) {
      cur.end = i;
      cur.top = Math.min(cur.top, b.top);
      cur.bottom = Math.max(cur.bottom, b.bottom);
    } else {
      rows.push({ start: i, end: i, top: b.top, bottom: b.bottom });
    }
  }
  return rows;
}

/**
 * Insertion index (0..otherBoxes.length) for the dragged card among the OTHER
 * slots, given the drag point.
 *
 * - **half** span → reading-order position (may land between two half cards).
 * - **full** span → snaps to a ROW boundary: a full card can't sit half a
 *   column, so the point's vertical position within a row decides before/after
 *   the whole row (upper half → before, lower half → after).
 */
export function slotInsertionIndex(
  otherBoxes: Box[],
  x: number,
  y: number,
  isFull: boolean,
): number {
  if (!isFull) return popInsertionIndex(otherBoxes, x, y);

  const rows = slotRows(otherBoxes);
  for (const row of rows) {
    if (y < row.top) return row.start; // above this row → before it
    if (y <= row.bottom) {
      const mid = (row.top + row.bottom) / 2;
      return y < mid ? row.start : row.end + 1;
    }
  }
  return otherBoxes.length; // below every row → append
}
