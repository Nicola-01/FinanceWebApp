import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../../hooks/useDebounce";

afterEach(() => vi.useRealTimers());

describe("useDebounce", () => {
  it("starts with the initial value and only updates after the delay settles", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 200), {
      initialProps: { v: "" },
    });
    expect(result.current).toBe("");

    rerender({ v: "a" });
    act(() => vi.advanceTimersByTime(150));
    rerender({ v: "ab" });
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBe("");

    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe("ab");
  });
});
