import { useState } from "react";

/** Multi-row selection as a `Set` of string keys. */
export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** Clears the selection when every key is already selected, else selects all `keys`. */
  const toggleAll = (keys: string[]) =>
    setSelected((prev) => {
      const selectedHere = keys.filter((k) => prev.has(k)).length;
      if (selectedHere === keys.length) return new Set();
      return new Set(keys);
    });

  const clearSelection = () => setSelected(new Set());

  return { selected, setSelected, toggleOne, toggleAll, clearSelection };
}
