/**
 * Shared "Back button closes the top overlay" manager for ResponsiveOverlay.
 *
 * Rather than one history entry per overlay (which races when one overlay closes
 * and another opens in the same tick — e.g. details → edit — because
 * `history.back()` is async while `pushState` is sync), the whole overlay stack
 * shares a SINGLE history entry. Push/pop of that entry is reconciled on a
 * microtask against the current stack depth, so an open-immediately-after-close
 * swap causes no history churn and never spuriously closes the new overlay.
 *
 * - Back pressed → the single entry pops → we close the top overlay; if others
 *   remain we re-push so the next Back closes the next one.
 * - Programmatic close (Esc / backdrop / ✕ / action) → unregister; when the
 *   stack empties we unwind our entry.
 */
type CloseFn = () => void;

const stack: CloseFn[] = [];
let pushed = 0;
let scheduled = false;
let listening = false;

function onPopState() {
  // Our entry was consumed by the Back navigation.
  pushed = Math.max(0, pushed - 1);
  const top = stack[stack.length - 1];
  if (top) top();
  reconcileSoon();
}

function ensureListening() {
  if (listening || typeof window === "undefined") return;
  window.addEventListener("popstate", onPopState);
  listening = true;
}

function reconcile() {
  scheduled = false;
  if (typeof window === "undefined") return;
  if (stack.length > 0 && pushed === 0) {
    window.history.pushState({ __overlay: true }, "");
    pushed = 1;
  } else if (stack.length === 0 && pushed > 0) {
    pushed = 0;
    window.history.back();
  }
  if (stack.length === 0 && pushed === 0 && listening) {
    window.removeEventListener("popstate", onPopState);
    listening = false;
  }
}

function reconcileSoon() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(reconcile);
}

/**
 * Register an open overlay's close callback. Returns an unregister function to
 * call when the overlay closes by any other means.
 */
export function registerOverlay(close: CloseFn): () => void {
  ensureListening(); // attach synchronously so Back works immediately
  stack.push(close);
  reconcileSoon();
  return () => {
    const i = stack.indexOf(close);
    if (i !== -1) stack.splice(i, 1);
    reconcileSoon();
  };
}
