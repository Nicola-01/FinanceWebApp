import { describe, it, expect } from "vitest";
import {
  boxContains,
  popInsertionIndex,
  type Box,
} from "../../../dashboard/layout/popPlacement";

const box = (
  left: number,
  top: number,
  right: number,
  bottom: number,
): Box => ({ left, top, right, bottom });

describe("boxContains", () => {
  const b = box(0, 0, 100, 100);

  it("is true inside (bounds inclusive)", () => {
    expect(boxContains(b, 50, 50)).toBe(true);
    expect(boxContains(b, 0, 0)).toBe(true);
    expect(boxContains(b, 100, 100)).toBe(true);
  });

  it("is false outside on any axis", () => {
    expect(boxContains(b, -1, 50)).toBe(false);
    expect(boxContains(b, 50, 101)).toBe(false);
    expect(boxContains(b, 200, 50)).toBe(false);
  });
});

describe("popInsertionIndex", () => {
  it("returns 0 for no slots", () => {
    expect(popInsertionIndex([], 10, 10)).toBe(0);
  });

  describe("single slot (0..100 square)", () => {
    const boxes = [box(0, 0, 100, 100)];
    it("inserts before when left of centre / above", () => {
      expect(popInsertionIndex(boxes, 40, 50)).toBe(0);
      expect(popInsertionIndex(boxes, 60, -20)).toBe(0);
    });
    it("inserts after when past the centre / below", () => {
      expect(popInsertionIndex(boxes, 60, 50)).toBe(1);
      expect(popInsertionIndex(boxes, 10, 150)).toBe(1);
    });
  });

  describe("two half-span slots on one row (A 0..100, B 120..220, y 0..100)", () => {
    const boxes = [box(0, 0, 100, 100), box(120, 0, 220, 100)];
    it("before A", () => expect(popInsertionIndex(boxes, 40, 50)).toBe(0));
    it("between A and B", () =>
      expect(popInsertionIndex(boxes, 60, 50)).toBe(1));
    it("after B", () => expect(popInsertionIndex(boxes, 200, 50)).toBe(2));
    it("below the whole row lands at the end", () =>
      expect(popInsertionIndex(boxes, 10, 150)).toBe(2));
  });

  describe("mixed grid: row0 [A,B] (y0..100), row1 [C full 0..220] (y120..220)", () => {
    const boxes = [
      box(0, 0, 100, 100),
      box(120, 0, 220, 100),
      box(0, 120, 220, 220),
    ];
    it("before the full-span C (its left half) → index 2", () =>
      expect(popInsertionIndex(boxes, 50, 170)).toBe(2));
    it("past the full-span C (its right half) → index 3", () =>
      expect(popInsertionIndex(boxes, 200, 170)).toBe(3));
    it("below everything → index 3", () =>
      expect(popInsertionIndex(boxes, 110, 300)).toBe(3));
    it("in the vertical gap between the rows → start of row1 (index 2)", () =>
      expect(popInsertionIndex(boxes, 200, 110)).toBe(2));
  });

  it("is monotonic in x across a row (never decreases as the pointer sweeps right)", () => {
    const boxes = [box(0, 0, 100, 100), box(120, 0, 220, 100)];
    let prev = -1;
    for (let x = -20; x <= 260; x += 5) {
      const idx = popInsertionIndex(boxes, x, 50);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
    expect(prev).toBe(2);
  });
});
