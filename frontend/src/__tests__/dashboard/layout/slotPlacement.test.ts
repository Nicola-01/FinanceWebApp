import { describe, it, expect } from "vitest";
import {
  slotRows,
  slotInsertionIndex,
} from "../../../dashboard/layout/slotPlacement";
import type { Box } from "../../../dashboard/layout/popPlacement";

const box = (
  left: number,
  top: number,
  right: number,
  bottom: number,
): Box => ({ left, top, right, bottom });

// Layout used across the suite (document coords), matching a 2-col grid with a
// 32px row gap:  row0 = [A, B] (half),  row1 = [C] (full).
const A = box(0, 0, 100, 100);
const B = box(120, 0, 220, 100);
const C = box(0, 132, 220, 232);

describe("slotRows", () => {
  it("clusters consecutive boxes into gap-separated rows", () => {
    const rows = slotRows([A, B, C]);
    expect(rows).toEqual([
      { start: 0, end: 1, top: 0, bottom: 100 },
      { start: 2, end: 2, top: 132, bottom: 232 },
    ]);
  });

  it("handles a single full row", () => {
    expect(slotRows([C])).toEqual([
      { start: 0, end: 0, top: 132, bottom: 232 },
    ]);
  });

  it("returns [] for no boxes", () => {
    expect(slotRows([])).toEqual([]);
  });

  it("keeps same-row boxes of unequal height together", () => {
    const tall = box(0, 0, 100, 140);
    const short = box(120, 0, 220, 100);
    const next = box(0, 172, 220, 272);
    expect(slotRows([tall, short, next])).toEqual([
      { start: 0, end: 1, top: 0, bottom: 140 },
      { start: 2, end: 2, top: 172, bottom: 272 },
    ]);
  });
});

describe("slotInsertionIndex — HALF dragged card (reading order)", () => {
  // A half card excludes itself; the others are e.g. [A, C].
  const others = [A, C];
  it("delegates to popInsertionIndex (before A)", () => {
    expect(slotInsertionIndex(others, 40, 50, false)).toBe(0);
  });
  it("after A on its row", () => {
    expect(slotInsertionIndex(others, 60, 50, false)).toBe(1);
  });
  it("past everything", () => {
    expect(slotInsertionIndex(others, 200, 300, false)).toBe(2);
  });
});

describe("slotInsertionIndex — FULL dragged card (row-boundary snap)", () => {
  // Dragging the full card C; the others are the half row [A, B].
  const others = [A, B];

  it("above the half row → before it (index 0), regardless of x", () => {
    expect(slotInsertionIndex(others, 200, -20, true)).toBe(0);
  });
  it("upper half of the half row → before it (index 0), never between A and B", () => {
    expect(slotInsertionIndex(others, 200, 30, true)).toBe(0);
  });
  it("lower half of the half row → after it (index 2)", () => {
    expect(slotInsertionIndex(others, 40, 80, true)).toBe(2);
  });
  it("below everything → end (index 2)", () => {
    expect(slotInsertionIndex(others, 40, 400, true)).toBe(2);
  });

  it("multiple half rows: full card snaps to the row boundary it points at", () => {
    const D = box(0, 132, 100, 232);
    const E = box(120, 132, 220, 232);
    const rows = [A, B, D, E]; // row0 [A,B], row1 [D,E]
    expect(slotInsertionIndex(rows, 60, 20, true)).toBe(0); // row0 upper → before all
    expect(slotInsertionIndex(rows, 60, 90, true)).toBe(2); // row0 lower → between rows
    expect(slotInsertionIndex(rows, 60, 150, true)).toBe(2); // row1 upper → between rows
    expect(slotInsertionIndex(rows, 60, 220, true)).toBe(4); // row1 lower → end
  });
});
