import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useShake } from "../../auth/useShake";
import { shakeClass } from "../../auth/authCardClass";

afterEach(() => vi.useRealTimers());

describe("useShake", () => {
  it("shakes for 500 ms, and can be cleared early", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useShake());
    expect(result.current.shake).toBe(false);
    act(() => result.current.triggerShake());
    expect(result.current.shake).toBe(true);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.shake).toBe(false);

    act(() => result.current.triggerShake());
    act(() => result.current.clearShake());
    expect(result.current.shake).toBe(false);
  });

  it("maps the flag to the animation class", () => {
    expect(shakeClass(true)).toBe("animate-[shake_0.5s_ease-in-out]");
    expect(shakeClass(false)).toBe("");
  });
});
