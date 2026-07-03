import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useMediaQuery } from "../../hooks/useMediaQuery.ts";
import { registerOverlay } from "../../utils/overlayHistory.ts";

export interface ResponsiveOverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Per-wallet accent for the header bar; falls back to the brand green. */
  accentColor?: string;
  /** Right-aligned header slot (e.g. edit / delete / stop actions). */
  headerActions?: React.ReactNode;
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
 * <body>; locks body scroll; kept below the icon-picker popup (z-[100]).
 */
export const ResponsiveOverlay: React.FC<ResponsiveOverlayProps> = ({
  open,
  onClose,
  title,
  subtitle,
  accentColor,
  headerActions,
  width = 440,
  children,
}) => {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const panelRef = useRef<HTMLElement>(null);

  // Keep the latest onClose without re-running the history effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDesktop && (
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
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
                ? "relative ml-auto flex h-full flex-col border-l border-app-border bg-app-surface shadow-2xl outline-none"
                : "relative flex h-full w-full flex-col bg-app-surface outline-none"
            }
            style={isDesktop ? { width, maxWidth: "92vw" } : undefined}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          >
            <header className="flex items-center gap-2 border-b border-app-border px-4 py-3">
              {!isDesktop && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Back"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
              )}

              <span
                aria-hidden
                className="h-6 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: accentColor || "var(--color-app-green)",
                }}
              />

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold text-app-text">
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

              {isDesktop && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
              {children}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
