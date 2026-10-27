import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Tag } from "../../../types/domain";
import { useCategoryTree } from "../../../dashboard/tag/useCategoryTree";
import { useCategoryTreeDnd } from "../../../dashboard/tag/useCategoryTreeDnd";

const tag = (name: string, parentName: string | null = null): Tag => ({
  name,
  icon: "tag",
  colorHex: "#8b5cf6",
  parentName,
});

const tags = [tag("Food"), tag("Pizza", "Food"), tag("Home")];

beforeEach(() => localStorage.clear());

describe("useCategoryTree", () => {
  it("derives the tree and resyncs when tags change", () => {
    const { result, rerender } = renderHook(
      ({ t }) => useCategoryTree("w1", t, []),
      { initialProps: { t: tags } },
    );
    expect(result.current.tree.map((n) => n.parent.name)).toEqual([
      "Food",
      "Home",
    ]);
    rerender({ t: [...tags, tag("Car")] });
    expect(result.current.tree).toHaveLength(3);
  });

  it("persists the sort mode per wallet", () => {
    const { result } = renderHook(() => useCategoryTree("w1", tags, []));
    expect(result.current.sortMode).toBe("custom");
    act(() => result.current.changeSort("name"));
    expect(result.current.sortMode).toBe("name");
    const again = renderHook(() => useCategoryTree("w1", tags, []));
    expect(again.result.current.sortMode).toBe("name");
  });
});

const start = (id: string) => ({ active: { id } }) as unknown as DragStartEvent;
const end = (id: string, overId: string | null) =>
  ({
    active: { id },
    over: overId ? { id: overId } : null,
  }) as unknown as DragEndEvent;

function setup(handleUpdateTag = vi.fn().mockResolvedValue(true)) {
  const { result } = renderHook(() => {
    const t = useCategoryTree("w1", tags, []);
    const dnd = useCategoryTreeDnd({
      walletId: "w1",
      tags,
      tree: t.tree,
      setTree: t.setTree,
      handleUpdateTag,
    });
    return { t, dnd };
  });
  return { result, handleUpdateTag };
}

describe("useCategoryTreeDnd", () => {
  it("reorders parents on drop", () => {
    const { result } = setup();
    act(() => result.current.dnd.handleDragStart(start("Home")));
    expect(result.current.dnd.activeNode?.parent.name).toBe("Home");
    act(() => result.current.dnd.handleDragEnd(end("Home", "Food")));
    expect(result.current.t.tree.map((n) => n.parent.name)).toEqual([
      "Home",
      "Food",
    ]);
    expect(result.current.dnd.activeNode).toBeNull();
  });

  it("restores the tree on cancel", () => {
    const { result } = setup();
    act(() => result.current.dnd.handleDragStart(start("Pizza")));
    expect(result.current.dnd.activeIsChild).toBe(true);
    expect(result.current.dnd.activeChild?.name).toBe("Pizza");
    act(() => result.current.dnd.handleDragCancel());
    expect(result.current.dnd.activeChild).toBeNull();
    expect(result.current.t.tree[0].children.map((c) => c.name)).toEqual([
      "Pizza",
    ]);
  });

  it("does not call the backend when a child stays in its parent", () => {
    const { result, handleUpdateTag } = setup();
    act(() => result.current.dnd.handleDragStart(start("Pizza")));
    act(() => result.current.dnd.handleDragEnd(end("Pizza", "Pizza")));
    expect(handleUpdateTag).not.toHaveBeenCalled();
  });
});
