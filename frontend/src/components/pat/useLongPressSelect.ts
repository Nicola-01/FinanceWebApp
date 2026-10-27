import type React from "react";
import { useCallback, useEffect, useRef } from "react";

/** Press-and-hold duration before a row enters selection mode. */
export const LONG_PRESS_MS = 500;
/** Pointer travel (px) that cancels an in-progress long-press. */
export const MOVE_TOLERANCE_PX = 8;

/**
 * Pointer handlers for a row that fires `onLongPress` after a press-and-hold
 * and `onQuickClick` on a normal click. Presses/clicks starting on a nested
 * `<button>` are ignored, moving the pointer cancels the hold, and the click
 * synthesized right after a successful long-press is swallowed.
 */
export function useLongPressSelect(
  onLongPress: () => void,
  onQuickClick: () => void,
) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const pressStart = useRef<{ x: number; y: number } | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    pressStart.current = null;
  }, []);

  useEffect(() => clearLongPress, [clearLongPress]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Presses that begin on an interactive control must not arm selection.
    if ((e.target as HTMLElement).closest("button")) return;
    longPressFired.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pressStart.current) return;
    const dx = Math.abs(e.clientX - pressStart.current.x);
    const dy = Math.abs(e.clientY - pressStart.current.y);
    if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clearLongPress();
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Clicks bubbling up from the action/reveal/copy buttons are ignored here.
    if ((e.target as HTMLElement).closest("button")) return;
    if (longPressFired.current) {
      // Swallow the click synthesized right after a successful long-press.
      longPressFired.current = false;
      return;
    }
    onQuickClick();
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: clearLongPress,
    onPointerLeave: clearLongPress,
    onPointerCancel: clearLongPress,
    onClick: handleRowClick,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
