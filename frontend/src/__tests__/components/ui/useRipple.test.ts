import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { PointerEvent } from "react";
import { useRipple } from "../../../components/ui/useRipple";

afterEach(() => vi.useRealTimers());

const pressAt = (clientX: number, clientY: number) =>
  ({
    clientX,
    clientY,
    currentTarget: {
      getBoundingClientRect: () => ({ left: 10, top: 20 }),
    },
  }) as unknown as PointerEvent<HTMLElement>;

describe("useRipple", () => {
  it("adds a ripple relative to the element and removes it after 600ms", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRipple());

    act(() => result.current.spawnRipple(pressAt(15, 50)));
    expect(result.current.ripples).toHaveLength(1);
    expect(result.current.ripples[0]).toMatchObject({ x: 5, y: 30 });

    act(() => vi.advanceTimersByTime(599));
    expect(result.current.ripples).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.ripples).toHaveLength(0);
  });

  it("cancels pending cleanups on unmount", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useRipple());
    act(() => result.current.spawnRipple(pressAt(0, 0)));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
