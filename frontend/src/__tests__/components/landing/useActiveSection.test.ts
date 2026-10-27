import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useActiveSection } from "../../../components/landing/useActiveSection";

type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void;

let callback: Cb = () => {};
const observe = vi.fn();
const disconnect = vi.fn();

vi.stubGlobal(
  "IntersectionObserver",
  vi.fn(function (this: unknown, cb: Cb) {
    callback = cb;
    return { observe, disconnect };
  }),
);

const IDS = ["hero", "features"];

describe("useActiveSection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("observes existing sections and reports the intersecting one", () => {
    document.body.innerHTML = '<div id="hero"></div><div id="features"></div>';
    const { result, unmount } = renderHook(() => useActiveSection(IDS, true));
    expect(observe).toHaveBeenCalledTimes(2);
    expect(result.current).toBeNull();

    act(() =>
      callback([
        { isIntersecting: false, target: document.getElementById("hero")! },
        {
          isIntersecting: true,
          target: document.getElementById("features")!,
        },
      ]),
    );
    expect(result.current).toBe("features");

    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("returns null and does not observe when disabled", () => {
    document.body.innerHTML = '<div id="hero"></div>';
    const { result } = renderHook(() => useActiveSection(IDS, false));
    expect(observe).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });
});
