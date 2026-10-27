import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, renderHook } from "@testing-library/react";
import type React from "react";
import { useDayNavigation } from "../../../modals/calendar/useDayNavigation";
import type { Subscription } from "../../../types/domain";

const day = (d: number) => new Date(2026, 0, d);
const subs = [{ id: "s1" }] as Subscription[];

const setup = (open = true) => {
  const resolve = vi.fn(() => subs);
  const dialogRef = {
    current: { open } as HTMLDialogElement,
  } as React.RefObject<HTMLDialogElement | null>;
  const hook = renderHook(() => useDayNavigation(resolve, dialogRef));
  act(() => hook.result.current.showDay(day(10), []));
  return { resolve, hook };
};

const touch = (x: number, y: number) =>
  ({
    touches: [{ clientX: x, clientY: y }],
    changedTouches: [{ clientX: x, clientY: y }],
  }) as unknown as React.TouchEvent;

describe("useDayNavigation", () => {
  it("moves a day back/forward and re-resolves subscriptions", () => {
    const { resolve, hook } = setup();
    expect(hook.result.current.subscriptions).toEqual([]);
    act(() => hook.result.current.goToNextDay());
    expect(hook.result.current.selectedDate).toEqual(day(11));
    expect(resolve).toHaveBeenLastCalledWith(day(11));
    expect(hook.result.current.subscriptions).toBe(subs);
    act(() => hook.result.current.goToPrevDay());
    act(() => hook.result.current.goToPrevDay());
    expect(hook.result.current.selectedDate).toEqual(day(9));
  });

  it("handles arrow keys only while the dialog is open", () => {
    const { hook } = setup();
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(hook.result.current.selectedDate).toEqual(day(11));
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowLeft" });
    });
    expect(hook.result.current.selectedDate).toEqual(day(10));

    const closed = setup(false);
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(closed.hook.result.current.selectedDate).toEqual(day(10));
  });

  it("swipes on a clear horizontal gesture only", () => {
    const { hook } = setup();
    // Right swipe → previous day.
    act(() => hook.result.current.handleTouchStart(touch(100, 100)));
    act(() => hook.result.current.handleTouchEnd(touch(200, 110)));
    expect(hook.result.current.selectedDate).toEqual(day(9));
    // Left swipe → next day.
    act(() => hook.result.current.handleTouchStart(touch(200, 100)));
    act(() => hook.result.current.handleTouchEnd(touch(100, 100)));
    expect(hook.result.current.selectedDate).toEqual(day(10));
    // Mostly vertical / too short → ignored.
    act(() => hook.result.current.handleTouchStart(touch(100, 100)));
    act(() => hook.result.current.handleTouchEnd(touch(160, 200)));
    act(() => hook.result.current.handleTouchStart(touch(100, 100)));
    act(() => hook.result.current.handleTouchEnd(touch(130, 100)));
    // End without a start → ignored.
    act(() => hook.result.current.handleTouchEnd(touch(0, 0)));
    expect(hook.result.current.selectedDate).toEqual(day(10));
  });
});
