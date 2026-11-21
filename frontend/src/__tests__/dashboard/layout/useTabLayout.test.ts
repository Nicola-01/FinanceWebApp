import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTabLayout } from "../../../dashboard/layout/useTabLayout.ts";

const ALL = [
  { id: "a", span: "full" as const },
  { id: "investments", span: "half" as const },
  { id: "b", span: "full" as const },
];
const WITHOUT = ALL.filter((w) => w.id !== "investments");

describe("useTabLayout", () => {
  beforeEach(() => localStorage.clear());

  it("re-reads the layout when the widget set changes", () => {
    const { result, rerender } = renderHook(
      ({ widgets }) => useTabLayout("t", "w1", widgets),
      { initialProps: { widgets: ALL } },
    );
    expect(result.current.layout.slots.map((s) => s.id)).toEqual([
      "a",
      "investments",
      "b",
    ]);

    rerender({ widgets: WITHOUT });
    expect(result.current.layout.slots.map((s) => s.id)).toEqual(["a", "b"]);

    rerender({ widgets: ALL });
    expect(result.current.layout.slots.map((s) => s.id)).toEqual([
      "a",
      "investments",
      "b",
    ]);
  });
});
