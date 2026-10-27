import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Wallet } from "../../../types/domain";
import { useWalletDragReorder } from "../../../dashboard/wallet/useWalletDragReorder";

const wallets = [{ id: "a" }, { id: "b" }, { id: "c" }] as Wallet[];

function setup() {
  return renderHook(() => {
    const [list, setList] = useState<Wallet[]>(wallets);
    return { list, ...useWalletDragReorder(setList) };
  });
}

const start = (id: string) => ({ active: { id } }) as unknown as DragStartEvent;
const end = (id: string, overId: string | null) =>
  ({
    active: { id },
    over: overId ? { id: overId } : null,
  }) as unknown as DragEndEvent;

/** Dispatches a click on the body; returns whether it was cancelled. */
const click = () => {
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
  document.body.dispatchEvent(ev);
  return ev.defaultPrevented;
};

describe("useWalletDragReorder", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("reorders and persists on drop over another wallet", () => {
    const { result } = setup();
    act(() => result.current.handleDragStart(start("a")));
    expect(result.current.activeId).toBe("a");

    act(() => result.current.handleDragEnd(end("a", "c")));
    expect(result.current.activeId).toBeNull();
    expect(result.current.list.map((w) => w.id)).toEqual(["b", "c", "a"]);
    expect(JSON.parse(localStorage.getItem("wallet_order")!)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("leaves the order alone when dropped on itself or nowhere", () => {
    const { result } = setup();
    act(() => result.current.handleDragEnd(end("a", "a")));
    act(() => result.current.handleDragEnd(end("a", null)));
    expect(result.current.list).toBe(wallets);
    expect(localStorage.getItem("wallet_order")).toBeNull();
  });

  it("swallows exactly the one trailing click after a drag", () => {
    const { result } = setup();
    act(() => result.current.handleDragStart(start("a")));
    act(() => result.current.handleDragEnd(end("a", null)));
    expect(click()).toBe(true);
    expect(click()).toBe(false);
  });

  it("disarms the swallow when no trailing click arrives", () => {
    const { result } = setup();
    act(() => result.current.handleDragStart(start("a")));
    act(() => result.current.handleDragCancel());
    expect(result.current.activeId).toBeNull();
    act(() => {
      vi.runAllTimers();
    });
    expect(click()).toBe(false);
  });
});
