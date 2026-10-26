import { useEffect, useRef, useState } from "react";

/**
 * Press-and-hold confirmation: `startHold` animates `progress` 0 → 1 over
 * `holdMs` (requestAnimationFrame) and fires `onComplete` when it fills;
 * `endHold` (pointer up/leave) cancels and resets. `startHold` is a no-op
 * while `enabled` is false.
 */
export function useHoldToConfirm(
  holdMs: number,
  onComplete: () => void,
  enabled = true,
) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  // Clean up any pending animation frame on unmount.
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const cancelHold = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const startHold = () => {
    if (!enabled) return;
    startRef.current = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - startRef.current) / holdMs);
      setProgress(p);
      if (p >= 1) {
        cancelHold();
        setProgress(0);
        onComplete();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const endHold = () => {
    cancelHold();
    setProgress(0);
  };

  return { progress, startHold, endHold };
}
