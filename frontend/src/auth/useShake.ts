import { useCallback, useEffect, useRef, useState } from "react";

/** Error wobble flag: `triggerShake()` sets it for 500 ms (the shake animation length). */
export function useShake() {
  const [shake, setShake] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clearShake = useCallback(() => {
    clearTimeout(timer.current);
    setShake(false);
  }, []);
  const triggerShake = useCallback(() => {
    clearTimeout(timer.current);
    setShake(true);
    timer.current = setTimeout(() => setShake(false), 500);
  }, []);
  // Drop a pending timer if the host unmounts mid-shake (it would setState on a dead component).
  useEffect(() => () => clearTimeout(timer.current), []);
  return { shake, triggerShake, clearShake };
}
