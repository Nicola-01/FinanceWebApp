import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useMediaQuery } from "../../hooks/useMediaQuery.ts";
import { useEscapeKey } from "../../hooks/useEscapeKey.ts";
import { registerOverlay } from "../../utils/overlayHistory.ts";
import { useUiVersion } from "../../hooks/useUiVersion";
import Button from "./Button";

export interface ResponsiveOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Per-wallet accent for the header bar; falls back to the brand green. */
  accentColor?: string;
  /** Right-aligned header slot (e.g. edit / delete / stop actions). */
  headerActions?: React.ReactNode;
  /** Sticky footer slot pinned to the bottom (primary CTA / edit+delete row). */
  footer?: React.ReactNode;
  /** Desktop drawer width in px (ignored on mobile — full-screen). */
  width?: number;
  children: React.ReactNode;
}

/** Desktop breakpoint: at/above this it's a right drawer, below it's full-screen. */
const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Responsive overlay surface for big forms / editors:
 * - **Desktop (≥768px):** right slide-over drawer with a dimmed backdrop.
 * - **Mobile (<768px):** full-screen panel (no backdrop), header shows a back arrow.
 *
 * Declarative `open`/`onClose`. Closes on Esc, backdrop click (desktop), the header
 * control, and the **browser Back button / swipe** (a history entry is pushed on open and
 * consumed on close, so back closes the overlay without changing route). Portals to
 * <body>; locks body scroll; z-[95]: above the sticky wallet tabs (z-90), below the icon-picker popup (z-[100]).
 */
export const ResponsiveOverlay: React.FC<ResponsiveOverlayProps> = ({
  open,
  onClose,
  title,
  subtitle,
  accentColor,
  headerActions,
  footer,
  width = 480,
  children,
}) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  const panelRef = useRef<HTMLElement>(null);

  // Keep the latest onClose without re-running the history effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on Escape.
  useEscapeKey(onClose, open);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Back button / gesture closes the top overlay (shared single-entry manager,
  // safe when one overlay closes as another opens — e.g. details → edit).
  useEffect(() => {
    if (!open) return;
    return registerOverlay(() => onCloseRef.current());
  }, [open]);

  // Basic focus management: focus the panel on open, restore the trigger on close.
  // Don't steal focus from a child that already auto-focused (e.g. the amount
  // input) — only grab the panel when nothing inside it has focus yet.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus();
    }
    return () => previouslyFocused?.focus?.();
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[95] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDesktop && (
            <div
              className={`absolute inset-0 bg-black/50 ${isV2 ? "" : "backdrop-blur-sm"}`}
              onClick={onClose}
              aria-hidden
            />
          )}

          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={
              isDesktop
                ? // ui-v2-switch: drawer rounds only its inner (left) edge.
                  isV2
                  ? "relative ml-auto flex h-full flex-col rounded-l-[var(--r-card)] bg-app-card shadow-[0_8px_24px_rgb(0_0_0/0.25),var(--box-ring)] outline-none"
                  : "relative ml-auto flex h-full flex-col border-l border-app-border bg-app-surface shadow-2xl outline-none"
                : `relative flex h-full w-full flex-col outline-none ${isV2 ? "bg-app-card" : "bg-app-surface"}`
            }
            style={isDesktop ? { width, maxWidth: "92vw" } : undefined}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          >
            <header className="flex items-center gap-2 border-b border-app-border px-4 py-3">
              {!isDesktop &&
                (isV2 ? ( // ui-v2-switch
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Back"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Back"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                  </button>
                ))}

              <span
                aria-hidden
                className="h-6 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: accentColor || "var(--color-app-green)",
                }}
              />

              <div className="min-w-0 flex-1">
                <h2
                  className={`truncate text-app-text ${
                    isV2
                      ? "font-display text-xl font-semibold tracking-[-0.02em]"
                      : "text-lg font-bold"
                  }`}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="truncate text-xs text-app-muted">{subtitle}</p>
                )}
              </div>

              {headerActions && (
                <div className="flex shrink-0 items-center gap-1">
                  {headerActions}
                </div>
              )}

              {isDesktop &&
                (isV2 ? ( // ui-v2-switch
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Close"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                ))}
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
              {children}
            </div>

            {footer && (
              <footer
                className={`shrink-0 border-t border-app-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
                  isV2 ? "bg-app-card" : "bg-app-surface"
                }`}
              >
                {footer}
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
