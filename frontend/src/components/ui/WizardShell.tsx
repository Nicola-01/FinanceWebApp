import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export interface WizardShellProps {
  open: boolean;
  title: ReactNode;
  subtitle?: string;
  /** Close request (X / Esc). The consumer owns any discard-confirm. */
  onClose: () => void;
  children: ReactNode;
}

/**
 * Full-screen overlay that hosts a `Wizard`. Portals over the app, locks body
 * scroll, closes on Esc, and centres a bounded content column. The hosted Wizard
 * fills that column and scrolls its own step content (its stepper and footer stay
 * pinned). Presentational only — navigation lives in the `Wizard` it wraps.
 */
export function WizardShell({
  open,
  title,
  subtitle,
  onClose,
  children,
}: WizardShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  const root = document.getElementById("modal-root") ?? document.body;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-app-bg">
      <header className="flex items-start justify-between gap-4 border-b border-app-border px-5 py-4 sm:px-8 lg:pt-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-app-text">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-app-muted">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-app-muted transition-colors hover:bg-app-input hover:text-app-text"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </header>

      {/* Bounded flex column: the hosted Wizard fills it and scrolls its own
          content, so the stepper and footer stay pinned. */}
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col px-5 sm:px-8 lg:pt-2">
        {children}
      </div>
    </div>,
    root,
  );
}

export default WizardShell;
