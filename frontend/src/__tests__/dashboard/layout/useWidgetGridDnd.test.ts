import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useWidgetGridDnd } from "../../../dashboard/layout/useWidgetGridDnd";
import { memberId } from "../../../dashboard/layout/mergeAwareCollision";
import type { TabLayoutApi } from "../../../dashboard/layout/useTabLayout";
import type { WidgetDef } from "../../../dashboard/layout/widgetTypes";
import type { TabLayout } from "../../../utils/tabLayout/types";

const def = (id: string, span: "half" | "full"): WidgetDef<null> => ({
  id,
  span,
  title: `Title ${id}`,
  subtitle: "",
  label: id.toUpperCase(),
  icon: faTag,
  render: () => null,
});

const defMap = new Map(
  [def("a", "half"), def("b", "full"), def("c", "half")].map((d) => [d.id, d]),
);

const layout: TabLayout = {
  slots: [
    { id: "a", widgets: ["a"] },
    { id: "g", widgets: ["b", "c"], activeWidget: "b" },
  ],
  hiddenSlots: [],
};

const makeApi = () =>
  ({
    layout,
    persist: vi.fn(),
    restore: vi.fn(),
    merge: vi.fn(),
    reorderSlotToIndex: vi.fn(),
    reorderMember: vi.fn(),
    popTo: vi.fn(),
    hide: vi.fn(),
    show: vi.fn(),
    setActive: vi.fn(),
    reset: vi.fn(),
  }) as unknown as TabLayoutApi & Record<string, ReturnType<typeof vi.fn>>;

const start = (id: string) =>
  ({
    active: { id },
    activatorEvent: new KeyboardEvent("keydown"),
  }) as unknown as DragStartEvent;
const over = (id: string | null) =>
  ({ over: id ? { id } : null }) as unknown as DragOverEvent & DragEndEvent;

function setup() {
  const api = makeApi();
  const hook = renderHook(() => useWidgetGridDnd(api, defMap));
  return { api, hook };
}

describe("useWidgetGridDnd", () => {
  it("slot drag exposes the active slot's members and span", () => {
    const { hook } = setup();
    act(() => hook.result.current.handlers.onDragStart(start("g")));
    const r = hook.result.current;
    expect(r.activeId).toBe("g");
    expect(r.activeMembers.map((m) => m.id)).toEqual(["b", "c"]);
    expect(r.activeSpan).toBe("full");
    expect(r.activeMemberDef).toBeNull();
    expect(r.displaySlots).toBe(layout.slots);
  });

  it("dropping on a merge target merges, then resets drag state", () => {
    const { api, hook } = setup();
    act(() => hook.result.current.handlers.onDragStart(start("a")));
    act(() => hook.result.current.handlers.onDragOver(over("merge:g")));
    expect(hook.result.current.mergeTarget).toBe("g");
    act(() => hook.result.current.handlers.onDragEnd(over("merge:g")));
    expect(api.merge).toHaveBeenCalledWith("a", "g");
    expect(hook.result.current.activeId).toBeNull();
    expect(hook.result.current.mergeTarget).toBeNull();
  });

  it("a slot drop with no preview just persists", () => {
    const { api, hook } = setup();
    act(() => hook.result.current.handlers.onDragStart(start("a")));
    act(() => hook.result.current.handlers.onDragEnd(over(null)));
    expect(api.persist).toHaveBeenCalled();
    expect(api.merge).not.toHaveBeenCalled();
  });

  it("cancel restores the pre-drag layout", () => {
    const { api, hook } = setup();
    act(() => hook.result.current.handlers.onDragStart(start("a")));
    act(() => hook.result.current.handlers.onDragCancel());
    expect(api.restore).toHaveBeenCalledWith(layout);
    expect(hook.result.current.activeId).toBeNull();
  });

  it("member drag: dropped on a sibling reorders within the group", () => {
    const { api, hook } = setup();
    act(() =>
      hook.result.current.handlers.onDragStart(start(memberId("g", "c"))),
    );
    expect(hook.result.current.activeMemberDef?.id).toBe("c");
    expect(hook.result.current.activeMembers).toEqual([]);
    act(() => hook.result.current.handlers.onDragOver(over("merge:a")));
    expect(hook.result.current.mergeTarget).toBeNull();
    act(() => hook.result.current.handlers.onDragEnd(over(memberId("g", "b"))));
    expect(api.reorderMember).toHaveBeenCalledWith("g", "c", "b");
  });

  it("member drag released elsewhere in the group moves it to the end", () => {
    const { api, hook } = setup();
    act(() =>
      hook.result.current.handlers.onDragStart(start(memberId("g", "b"))),
    );
    act(() => hook.result.current.handlers.onDragEnd(over(null)));
    expect(api.reorderMember).toHaveBeenCalledWith("g", "b", "c");
  });
});
