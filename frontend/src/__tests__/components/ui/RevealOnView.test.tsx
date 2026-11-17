import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { RevealOnView } from "../../../components/ui/RevealOnView";

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

describe("RevealOnView", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders children immediately without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(
      <RevealOnView>
        <p>chart body</p>
      </RevealOnView>,
    );
    expect(screen.getByText("chart body")).toBeInTheDocument();
  });

  it("mounts children only after the wrapper intersects, then disconnects", () => {
    let callback: IOCallback = () => {};
    const observe = vi.fn();
    const disconnect = vi.fn();
    class MockIO {
      constructor(cb: IOCallback) {
        callback = cb;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIO);

    render(
      <RevealOnView>
        <p>chart body</p>
      </RevealOnView>,
    );
    expect(observe).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("chart body")).not.toBeInTheDocument();

    act(() => callback([{ isIntersecting: false }]));
    expect(screen.queryByText("chart body")).not.toBeInTheDocument();

    act(() => callback([{ isIntersecting: true }]));
    expect(screen.getByText("chart body")).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });

  it("reserves the placeholder height (default 260, or minHeight)", () => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
    const { container, rerender } = render(
      <RevealOnView>
        <p>body</p>
      </RevealOnView>,
    );
    expect(container.firstElementChild).toHaveStyle({ minHeight: "260px" });

    rerender(
      <RevealOnView minHeight={320}>
        <p>body</p>
      </RevealOnView>,
    );
    expect(container.firstElementChild).toHaveStyle({ minHeight: "320px" });
  });
});
