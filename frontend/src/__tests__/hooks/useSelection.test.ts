import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSelection } from "../../hooks/useSelection";

describe("useSelection", () => {
  it("toggles single keys in and out", () => {
    const { result } = renderHook(() => useSelection());
    act(() => result.current.toggleOne("a"));
    act(() => result.current.toggleOne("b"));
    expect([...result.current.selected]).toEqual(["a", "b"]);
    act(() => result.current.toggleOne("a"));
    expect([...result.current.selected]).toEqual(["b"]);
  });

  it("toggleAll selects every key unless all are already selected", () => {
    const { result } = renderHook(() => useSelection());
    act(() => result.current.toggleOne("a"));
    act(() => result.current.toggleAll(["a", "b"]));
    expect([...result.current.selected]).toEqual(["a", "b"]);
    act(() => result.current.toggleAll(["a", "b"]));
    expect(result.current.selected.size).toBe(0);
  });

  it("clearSelection empties the set", () => {
    const { result } = renderHook(() => useSelection());
    act(() => result.current.toggleOne("a"));
    act(() => result.current.clearSelection());
    expect(result.current.selected.size).toBe(0);
  });
});
