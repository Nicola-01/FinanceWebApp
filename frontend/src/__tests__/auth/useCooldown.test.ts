import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { formatCooldown, useCooldown } from "../../auth/useCooldown";

afterEach(() => vi.useRealTimers());

describe("useCooldown", () => {
  it("ticks down once per second and stops at 0", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCooldown());
    act(() => result.current.setCooldown(2));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.cooldown).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.cooldown).toBe(0);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.cooldown).toBe(0);
  });
});

describe("formatCooldown", () => {
  it("formats M:SS", () => {
    expect(formatCooldown(60)).toBe("1:00");
    expect(formatCooldown(9)).toBe("0:09");
  });
});
