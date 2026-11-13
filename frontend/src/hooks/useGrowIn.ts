import { useEffect, useState } from "react";
import { useMediaQuery } from "./useMediaQuery.ts";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Grow-in for v2 bars: false on mount, true one frame later (after `delay` ms) so the width
 * transitions from 0. Always true when disabled or under prefers-reduced-motion.
 */
export function useGrowIn(delay = 0, enabled = true): boolean {
  const reduced = useMediaQuery(REDUCED_MOTION);
  const [grown, setGrown] = useState(false);
  const skip = !enabled || reduced;
  useEffect(() => {
    if (skip) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      if (delay > 0) timer = setTimeout(() => setGrown(true), delay);
      else setGrown(true);
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [delay, skip]);
  return skip || grown;
}
