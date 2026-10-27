import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHoldToConfirm } from "../../hooks/useHoldToConfirm";

// Manual RAF queue so frames are driven with explicit timestamps.
let frames: Map<number, FrameRequestCallback>;
let nextId: number;
const flushFrame = (t: number) => {
  const pending = [...frames.values()];
  frames.clear();
  pending.forEach((cb) => cb(t));
};

beforeEach(() => {
  frames = new Map();
  nextId = 1;
  vi.spyOn(performance, "now").mockReturnValue(0);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.set(nextId, cb);
    return nextId++;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useHoldToConfirm", () => {
  it("fills progress over holdMs and fires onComplete once, then resets", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useHoldToConfirm(1000, onComplete));

    act(() => result.current.startHold());
    act(() => flushFrame(500));
    expect(result.current.progress).toBe(0.5);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => flushFrame(1000));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.progress).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("endHold cancels the hold and resets progress", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useHoldToConfirm(1000, onComplete));

    act(() => result.current.startHold());
    act(() => flushFrame(400));
    act(() => result.current.endHold());
    expect(result.current.progress).toBe(0);
    act(() => flushFrame(2000));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useHoldToConfirm(1000, onComplete, false),
    );
    act(() => result.current.startHold());
    expect(frames.size).toBe(0);
  });
});
