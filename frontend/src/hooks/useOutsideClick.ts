import { useEffect, useRef, type RefObject } from "react";

/**
 * Calls `onOutside` on a document `mousedown` whose target is outside `ref`.
 * Listens only while `enabled`. The latest `onOutside` is always used, so it
 * need not be memoised.
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutside: (event: MouseEvent) => void,
  enabled = true,
) {
  const handlerRef = useRef(onOutside);
  useEffect(() => {
    handlerRef.current = onOutside;
  });

  useEffect(() => {
    if (!enabled) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current(event);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, enabled]);
}
