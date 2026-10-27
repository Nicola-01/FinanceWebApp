import { useEffect, useRef, useState, type PointerEvent } from "react";

export interface RippleItem {
  x: number;
  y: number;
  id: number;
}

/**
 * Material-style press ripple state: `spawnRipple` adds a ripple at the pointer
 * position (relative to the pressed element) and drops it after 600 ms, the
 * length of the `custom-ripple` animation. Callers render `ripples`.
 */
export function useRipple() {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  // Track pending ripple-cleanup timers so they can be cancelled on unmount —
  // otherwise a late setState fires after teardown ("window is not defined").
  const rippleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      rippleTimers.current.forEach(clearTimeout);
      rippleTimers.current = [];
    },
    [],
  );

  const spawnRipple = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const item: RippleItem = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now(),
    };
    setRipples((prev) => [...prev, item]);
    const timer = setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== item.id));
      rippleTimers.current = rippleTimers.current.filter((t) => t !== timer);
    }, 600);
    rippleTimers.current.push(timer);
  };

  return { ripples, spawnRipple };
}
