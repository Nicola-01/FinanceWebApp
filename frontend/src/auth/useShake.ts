import { useCallback, useState } from "react";

/** Error wobble flag: `triggerShake()` sets it for 500 ms (the shake animation length). */
export function useShake() {
  const [shake, setShake] = useState(false);
  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);
  const clearShake = useCallback(() => setShake(false), []);
  return { shake, triggerShake, clearShake };
}
