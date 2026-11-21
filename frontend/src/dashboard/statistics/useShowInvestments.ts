import { useState } from "react";

/** An Investments chip's on/off state, remembered on this device under `key`. */
export function useShowInvestments(
  key: string,
): [boolean, (next: boolean) => void] {
  const [on, setOn] = useState(() => localStorage.getItem(key) === "true");
  const set = (next: boolean) => {
    setOn(next);
    localStorage.setItem(key, String(next));
  };
  return [on, set];
}
