import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNow } from "../../hooks/useNow";

afterEach(() => vi.useRealTimers());

describe("useNow", () => {
  it("returns the current time and ticks every second", () => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    const { result } = renderHook(() => useNow());
    expect(result.current).toBe(10_000);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(11_000);
  });
});
