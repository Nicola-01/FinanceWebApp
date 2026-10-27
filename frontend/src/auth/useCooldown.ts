import { useEffect, useState } from "react";

/** Seconds-remaining countdown; `setCooldown(n)` (re)starts it, ticking down to 0. */
export function useCooldown() {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  return { cooldown, setCooldown };
}

/** Format a cooldown as M:SS. */
export const formatCooldown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};
