import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { progressWidth } from "../../../utils/progressWidth";
import { setUiVersion } from "../../../utils/uiVersion";

/** Queues rAF callbacks so a test decides when the "next frame" happens. */
let frames: FrameRequestCallback[] = [];
const flushFrames = () => {
  const pending = frames;
  frames = [];
  act(() => pending.forEach((cb) => cb(0)));
};
const mockReducedMotion = (matches: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );

beforeEach(() => {
  frames = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    frames.push(cb);
    return frames.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  setUiVersion("v1");
});

describe("progressWidth", () => {
  it("clamps the ratio to 0..100 and maps NaN to 0", () => {
    expect(progressWidth(0.5)).toBe(50);
    expect(progressWidth(1.56)).toBe(100);
    expect(progressWidth(-1)).toBe(0);
    expect(progressWidth(Number.NaN)).toBe(0);
  });
});

describe("ProgressBar", () => {
  it("reports an unclamped aria-valuenow", () => {
    render(<ProgressBar value={1.56} label="Budget" />);
    const bar = screen.getByRole("progressbar", { name: "Budget" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "156");
    expect(bar.firstElementChild).toHaveStyle({ width: "100%" });
  });

  it("applies the status background class (ok by default)", () => {
    const { rerender } = render(<ProgressBar value={0.2} label="Pot" />);
    const fill = () => screen.getByRole("progressbar").firstElementChild;
    expect(fill()).toHaveClass("bg-app-income");

    rerender(<ProgressBar value={0.2} status="danger" label="Pot" />);
    expect(fill()).toHaveClass("bg-app-danger");
    expect(fill()).not.toHaveClass("bg-app-income");
  });

  it("lets the colour prop win over the status", () => {
    render(
      <ProgressBar value={0.5} status="warn" color="#123456" label="Pot" />,
    );
    const fill = screen.getByRole("progressbar").firstElementChild;
    expect(fill).toHaveStyle({ backgroundColor: "#123456" });
    expect(fill).not.toHaveClass("bg-app-warn-fill");
  });

  it('uses sm size classes with size="sm"', () => {
    render(<ProgressBar value={0.5} size="sm" label="Pot" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveClass("h-1.5", "rounded-[3px]");
    expect(bar).not.toHaveClass("h-2.5");
  });
});

describe("ProgressBar grow-in (v2)", () => {
  it("keeps v1 at the target width with no transition", () => {
    render(<ProgressBar value={0.5} label="Pot" />);
    const fill = screen.getByRole("progressbar").firstElementChild;
    expect(fill).toHaveStyle({ width: "50%" });
    expect(fill).not.toHaveClass("transition-[width]");
    expect(frames).toHaveLength(0);
  });

  it("starts at 0 and grows to the target on the next frame", () => {
    setUiVersion("v2");
    render(<ProgressBar value={0.5} label="Pot" />);
    const fill = screen.getByRole("progressbar").firstElementChild;
    expect(fill).toHaveStyle({ width: "0%" });
    expect(fill).toHaveClass("transition-[width]", "duration-700");
    flushFrames();
    expect(fill).toHaveStyle({ width: "50%" });
  });

  it("waits for the delay before growing", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    setUiVersion("v2");
    render(<ProgressBar value={0.5} label="Pot" delay={200} />);
    const fill = screen.getByRole("progressbar").firstElementChild;
    flushFrames();
    expect(fill).toHaveStyle({ width: "0%" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fill).toHaveStyle({ width: "50%" });
  });

  it("follows value changes once grown", () => {
    setUiVersion("v2");
    const { rerender } = render(<ProgressBar value={0.2} label="Pot" />);
    flushFrames();
    rerender(<ProgressBar value={0.8} label="Pot" />);
    expect(screen.getByRole("progressbar").firstElementChild).toHaveStyle({
      width: "80%",
    });
  });

  it("renders the target immediately under prefers-reduced-motion", () => {
    mockReducedMotion(true);
    setUiVersion("v2");
    render(<ProgressBar value={0.5} label="Pot" />);
    const fill = screen.getByRole("progressbar").firstElementChild;
    expect(fill).toHaveStyle({ width: "50%" });
    expect(fill).toHaveClass("motion-reduce:transition-none");
    expect(frames).toHaveLength(0);
  });
});
