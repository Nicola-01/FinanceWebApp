import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMobileMath } from "./useMobileMath";

// Minimal matchMedia stub that reports a fixed `matches` value.
const makeMatchMedia =
  (matches: boolean) =>
  (query: string): MediaQueryList =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;

// Minimal visualViewport fake with a dispatchable event registry.
interface FakeViewport {
  height: number;
  offsetTop: number;
  addEventListener: (type: string, cb: () => void) => void;
  removeEventListener: (type: string, cb: () => void) => void;
  dispatch: (type: string) => void;
}

const makeViewport = (height: number, offsetTop = 0): FakeViewport => {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    height,
    offsetTop,
    addEventListener(type, cb) {
      (listeners[type] ||= []).push(cb);
    },
    removeEventListener(type, cb) {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== cb);
    },
    dispatch(type) {
      (listeners[type] ?? []).forEach((cb) => cb());
    },
  };
};

const originalMatchMedia = window.matchMedia;
const originalViewport = window.visualViewport;
const originalInnerHeight = window.innerHeight;

const setInnerHeight = (value: number) => {
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    writable: true,
    value,
  });
};

const setViewport = (value: unknown) => {
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    writable: true,
    value,
  });
};

describe("useMobileMath", () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    setViewport(originalViewport);
    setInnerHeight(originalInnerHeight);
    vi.restoreAllMocks();
  });

  it("reports isMobile false when the pointer is not coarse", () => {
    window.matchMedia = makeMatchMedia(false);
    const { result } = renderHook(() => useMobileMath());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.keyboardHeight).toBe(0);
  });

  it("reports isMobile true when the pointer is coarse", () => {
    window.matchMedia = makeMatchMedia(true);
    setViewport(makeViewport(768));
    const { result } = renderHook(() => useMobileMath());
    expect(result.current.isMobile).toBe(true);
  });

  it("computes the keyboard height from the visual viewport on resize", () => {
    window.matchMedia = makeMatchMedia(true);
    setInnerHeight(900);
    const viewport = makeViewport(600, 0);
    setViewport(viewport);

    const { result } = renderHook(() => useMobileMath());
    // No viewport event yet -> keyboard is considered closed.
    expect(result.current.keyboardHeight).toBe(0);

    act(() => {
      viewport.dispatch("resize");
    });
    // innerHeight(900) - viewport.height(600) - offsetTop(0) = 300
    expect(result.current.keyboardHeight).toBe(300);
  });

  it("clamps a negative keyboard height to zero", () => {
    window.matchMedia = makeMatchMedia(true);
    setInnerHeight(800);
    const viewport = makeViewport(1000, 0);
    setViewport(viewport);

    const { result } = renderHook(() => useMobileMath());
    act(() => {
      viewport.dispatch("scroll");
    });
    expect(result.current.keyboardHeight).toBe(0);
  });

  it("keeps the keyboard height at zero when visualViewport is unavailable", () => {
    window.matchMedia = makeMatchMedia(true);
    setViewport(undefined);
    const { result } = renderHook(() => useMobileMath());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.keyboardHeight).toBe(0);
  });
});
