import { afterEach, describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { SplitBar } from "../../../components/ui/SplitBar";
import { splitParts, type SplitSegment } from "../../../utils/splitParts";
import { setUiVersion } from "../../../utils/uiVersion";

afterEach(() => {
  vi.restoreAllMocks();
  setUiVersion("v1");
});

const seg = (id: string, value: number, label = id): SplitSegment => ({
  id,
  label,
  value,
  color: "#123456",
});

describe("splitParts", () => {
  it("sorts by value descending and computes percentages", () => {
    const parts = splitParts([seg("a", 1), seg("b", 3)]);
    expect(parts.map((p) => p.segment.id)).toEqual(["b", "a"]);
    expect(parts[0].pct).toBeCloseTo(75);
    expect(parts[0].pctLabel).toBe("75%");
    expect(parts[1].pctLabel).toBe("25%");
  });

  it("drops zero, negative and non-finite values", () => {
    const parts = splitParts([
      seg("a", 0),
      seg("b", -5),
      seg("c", Number.NaN),
      seg("d", Number.POSITIVE_INFINITY),
      seg("e", 2),
    ]);
    expect(parts.map((p) => p.segment.id)).toEqual(["e"]);
    expect(parts[0].pct).toBe(100);
  });

  it("labels shares below 1% as <1%", () => {
    const parts = splitParts([seg("big", 999), seg("tiny", 1)]);
    expect(parts[1].pctLabel).toBe("<1%");
  });

  it("rounds to whole percentages", () => {
    const parts = splitParts([seg("a", 1), seg("b", 2)]);
    expect(parts.map((p) => p.pctLabel)).toEqual(["67%", "33%"]);
  });

  it("returns [] for empty input or zero total", () => {
    expect(splitParts([])).toEqual([]);
    expect(splitParts([seg("a", 0)])).toEqual([]);
  });
});

describe("SplitBar", () => {
  it("renders null when there is nothing to show", () => {
    const { container } = render(
      <SplitBar segments={[seg("a", 0)]} ariaLabel="Split" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one bar segment per part with its width and an aria-label", () => {
    const { container } = render(
      <SplitBar
        segments={[seg("a", 1, "Food"), seg("b", 3, "Rent")]}
        ariaLabel="Spending split"
      />,
    );
    const bar = screen.getByRole("img", { name: "Spending split" });
    const spans = bar.querySelectorAll("span");
    expect(spans).toHaveLength(2);
    expect(spans[0]).toHaveStyle({ width: "75%" });
    expect(spans[0]).toHaveAttribute("title", "Rent: 75%");
    expect(spans[1]).toHaveStyle({ width: "25%" });
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("hides the legend when legend is false", () => {
    const { container } = render(
      <SplitBar segments={[seg("a", 1)]} ariaLabel="Split" legend={false} />,
    );
    expect(container.querySelector("ul")).toBeNull();
  });
});

describe("SplitBar legend", () => {
  it("shows whole percentages and <1% for tiny shares", () => {
    render(
      <SplitBar
        segments={[seg("big", 999, "Rent"), seg("tiny", 1, "Coffee")]}
        ariaLabel="Split"
      />,
    );
    expect(screen.getByText("100%", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("<1%")).toBeInTheDocument();
  });
});

describe("SplitBar grow-in (v2)", () => {
  it("grows every segment from 0 to its share on the next frame", () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    setUiVersion("v2");
    render(
      <SplitBar
        segments={[seg("a", 1, "Food"), seg("b", 3, "Rent")]}
        ariaLabel="Spending split"
      />,
    );
    const spans = screen
      .getByRole("img", { name: "Spending split" })
      .querySelectorAll("span");
    expect(spans[0]).toHaveStyle({ width: "0%" });
    expect(spans[1]).toHaveStyle({ width: "0%" });
    act(() => frames.forEach((cb) => cb(0)));
    expect(spans[0]).toHaveStyle({ width: "75%" });
    expect(spans[1]).toHaveStyle({ width: "25%" });
  });

  it("keeps v1 segments at their share with no transition", () => {
    const { container } = render(
      <SplitBar segments={[seg("a", 1), seg("b", 3)]} ariaLabel="Split" />,
    );
    const spans = container.querySelectorAll('[role="img"] > span');
    expect(spans[0]).toHaveStyle({ width: "75%" });
    expect(spans[0]).not.toHaveClass("transition-[width]");
  });
});
