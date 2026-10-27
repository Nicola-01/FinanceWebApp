import { useEffect, useState } from "react";

/** Current `Date.now()`, re-rendering every second (for live countdowns). */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}
