import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { faTag } from "@fortawesome/free-solid-svg-icons";

vi.mock("../../../dashboard/wallet/WalletContext.tsx", () => ({ useWalletContext: vi.fn() }));

import { mergeAwareCollision } from "../../../dashboard/layout/mergeAwareCollision";
import { WidgetGrid } from "../../../dashboard/layout/WidgetGrid";
import { useTabLayout } from "../../../dashboard/layout/useTabLayout";
import { useWalletContext } from "../../../dashboard/wallet/WalletContext.tsx";
import type { WidgetDef } from "../../../dashboard/layout/widgetTypes";
import type { TabLayout } from "../../../utils/tabLayout";
import type { Active, ClientRect, DroppableContainer } from "@dnd-kit/core";

const mockedCtx = useWalletContext as unknown as ReturnType<typeof vi.fn>;

type Ctx = Record<string, never>;

const def = (
  id: string,
  span: "half" | "full",
  hiddenByDefault = false,
): WidgetDef<Ctx> => ({
  id,
  span,
  hiddenByDefault,
  title: `Title ${id.toUpperCase()}`,
  subtitle: `Subtitle ${id}`,
  label: id.toUpperCase(),
  icon: faTag,
  render: (_ctx, bare) => (
    <div data-testid={`widget-${id}`} data-bare={String(bare)} />
  ),
});

const DEFS: WidgetDef<Ctx>[] = [
  def("a", "half"),
  def("b", "half"),
  def("c", "full"),
  def("h", "full", true),
];

const KEY = "tab_layout_testtab_w1";

function Harness({ editing }: { editing: boolean }) {
  const api = useTabLayout("testtab", "w1", DEFS);
  return (
    <div>
      <button type="button" onClick={api.reset}>
        harness-reset
      </button>
      <WidgetGrid
        defs={DEFS}
        ctx={{}}
        editing={editing}
        api={api}
        accentColor="#8b5cf6"
      />
    </div>
  );
}

const storedLayout = (layout: TabLayout) =>
  localStorage.setItem(KEY, JSON.stringify(layout));

describe("WidgetGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedCtx.mockReturnValue({
      wallet: { id: "w1", color: "#8b5cf6" },
    });
  });

  it("renders visible widgets standalone (not bare); hidden ones stay out; no tray outside edit mode", () => {
    render(<Harness editing={false} />);
    expect(screen.getByTestId("widget-a")).toHaveAttribute(
      "data-bare",
      "false",
    );
    expect(screen.getByTestId("widget-b")).toBeInTheDocument();
    expect(screen.getByTestId("widget-c")).toBeInTheDocument();
    expect(screen.queryByTestId("widget-h")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden widgets")).not.toBeInTheDocument();
  });

  it("edit mode shows the tray; a chip restores the widget and persists it", () => {
    render(<Harness editing />);
    expect(screen.getByText("Hidden widgets")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show H" }));
    expect(screen.getByTestId("widget-h")).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["a", "b", "c", "h"]);
    expect(stored.hiddenSlots).toEqual([]);
  });

  it("the eye button hides a widget into the tray and persists", () => {
    render(<Harness editing />);
    fireEvent.click(screen.getByRole("button", { name: "Hide Title A" }));

    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show A" })).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["b", "c"]);
    expect(stored.hiddenSlots.map((s) => s.id)).toEqual(["h", "a"]);
  });

  it("renders a stored group as a SwitchableCard and switches tabs (bare members)", () => {
    storedLayout({
      slots: [
        { id: "group-1", widgets: ["a", "b"], activeWidget: "a" },
        { id: "c", widgets: ["c"] },
      ],
      hiddenSlots: [{ id: "h", widgets: ["h"] }],
    });
    render(<Harness editing={false} />);

    // Group header shows the active member's title; member renders bare.
    expect(screen.getByText("Title A")).toBeInTheDocument();
    expect(screen.getByTestId("widget-a")).toHaveAttribute("data-bare", "true");
    expect(screen.queryByTestId("widget-b")).not.toBeInTheDocument();

    // Switch to the B tab (desktop Selector renders one button per tab).
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(screen.getByTestId("widget-b")).toHaveAttribute("data-bare", "true");
    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots[0].activeWidget).toBe("b");
  });

  it("edit mode: popping a member out dissolves a 2-widget group", () => {
    storedLayout({
      slots: [
        { id: "group-1", widgets: ["a", "b"], activeWidget: "a" },
        { id: "c", widgets: ["c"] },
      ],
      hiddenSlots: [{ id: "h", widgets: ["h"] }],
    });
    render(<Harness editing />);

    fireEvent.click(
      screen.getByRole("button", { name: "Remove B from group" }),
    );

    // Both widgets are standalone (not bare) now.
    expect(screen.getByTestId("widget-a")).toHaveAttribute(
      "data-bare",
      "false",
    );
    expect(screen.getByTestId("widget-b")).toHaveAttribute(
      "data-bare",
      "false",
    );
    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("hiding a group stores it as one unit and its chip restores it intact", () => {
    storedLayout({
      slots: [
        { id: "group-1", widgets: ["a", "b"] },
        { id: "c", widgets: ["c"] },
      ],
      hiddenSlots: [{ id: "h", widgets: ["h"] }],
    });
    render(<Harness editing />);

    fireEvent.click(screen.getByRole("button", { name: "Hide A + B" }));
    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show A + B" }));
    expect(screen.getByTestId("widget-a")).toHaveAttribute("data-bare", "true");

    const stored = JSON.parse(localStorage.getItem(KEY)!) as TabLayout;
    expect(stored.slots.map((s) => s.id)).toEqual(["c", "group-1"]);
  });

  describe("mergeAwareCollision", () => {
    const rect = (
      left: number,
      top: number,
      width: number,
      height: number,
    ): ClientRect => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    });

    // Two adjacent half-span cards with a 20px gap; the merge zone is the
    // target card's central inset-[18%] area (only present when spans match).
    const SLOT_A = rect(0, 0, 500, 300);
    const SLOT_B = rect(520, 0, 500, 300);
    const MERGE_B = rect(520 + 90, 54, 320, 192);

    const args = (
      pointer: { x: number; y: number },
      withMergeZone: boolean,
    ) => {
      const droppableRects = new Map<string, ClientRect>([
        ["a", SLOT_A],
        ["b", SLOT_B],
        ...(withMergeZone ? [["merge:b", MERGE_B] as const] : []),
      ]);
      return {
        active: { id: "a" } as Active,
        // The dragged rect, centered on the pointer (closestCenter input).
        collisionRect: rect(pointer.x - 250, pointer.y - 150, 500, 300),
        droppableRects,
        droppableContainers: [...droppableRects.keys()].map(
          (id) => ({ id }) as DroppableContainer,
        ),
        pointerCoordinates: pointer,
      };
    };

    it("returns the merge zone when the pointer is inside it", () => {
      const hits = mergeAwareCollision(args({ x: 770, y: 150 }, true));
      expect(hits.map((c) => c.id)).toEqual(["merge:b"]);
    });

    it("suppresses reorder while the pointer is inside a valid merge target but outside its zone", () => {
      // x=540 is inside slot B's card but before its central merge zone: a
      // closest-center reorder here would sweep B away before the pointer
      // could ever reach the zone.
      expect(mergeAwareCollision(args({ x: 540, y: 150 }, true))).toEqual([]);
    });

    it("still reorders past the gap midpoint when the pointer is not over the target card", () => {
      const hits = mergeAwareCollision(args({ x: 515, y: 150 }, true));
      expect(hits[0]?.id).toBe("b");
    });

    it("falls back to closest-center reorder over the card when no merge zone exists (span mismatch)", () => {
      const hits = mergeAwareCollision(args({ x: 540, y: 150 }, false));
      expect(hits[0]?.id).toBe("b");
    });
  });

  it("reset restores the default layout and clears storage", () => {
    storedLayout({
      slots: [{ id: "c", widgets: ["c"] }],
      hiddenSlots: [
        { id: "h", widgets: ["h"] },
        { id: "a", widgets: ["a"] },
        { id: "b", widgets: ["b"] },
      ],
    });
    render(<Harness editing />);
    expect(screen.queryByTestId("widget-a")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "harness-reset" }));
    expect(screen.getByTestId("widget-a")).toBeInTheDocument();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
