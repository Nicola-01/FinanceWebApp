import { useEffect } from "react";

let openCount = 0;

/**
 * While `open`: lock body scroll and flag `body[data-overlay-open]` so the fixed
 * mobile bottom bar (z-1100) hides under full-screen surfaces. Counted for nesting.
 */
export function useOverlayBodyLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    openCount++;
    document.body.dataset.overlayOpen = "";
    return () => {
      document.body.style.overflow = prev;
      openCount--;
      if (openCount === 0) delete document.body.dataset.overlayOpen;
    };
  }, [open]);
}
