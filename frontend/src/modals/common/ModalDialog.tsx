import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { ModalDialogRightAction } from "./ModalDialogRightAction";
import type { ModalDialogRightActionProp } from "./ModalDialogRightAction";

interface ModalDialogProps {
  ref?: React.Ref<HTMLDialogElement>;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  onCancel?: (e: React.SyntheticEvent<HTMLDialogElement>) => void;
  showClose?: boolean;
  onCloseClick?: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Secondary header actions (icon buttons), rendered left of the close X. */
  rightActions?: ModalDialogRightActionProp[];
  /** Bottom CTA row — put the primary/secondary <Button>s here, not in the header. */
  footer?: React.ReactNode;
}

export const ModalDialog = ({
  ref,
  children,
  className = "",
  onClose,
  onCancel,
  showClose = true,
  onCloseClick,
  rightActions,
  title,
  subtitle,
  footer,
}: ModalDialogProps) => {
  const modalRoot = document.getElementById("modal-root");

  // Tracks whether an outside-click press *started* on the backdrop, so a drag
  // that begins inside the dialog (e.g. selecting text in an input) and releases
  // on the backdrop doesn't dismiss it.
  const pointerDownOnBackdrop = useRef(false);

  useEffect(() => {
    const dialogNode = ref && "current" in ref ? ref.current : null;
    if (!dialogNode) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "open") {
          if (dialogNode.hasAttribute("open")) {
            document.body.style.overflow = "hidden";
          } else {
            document.body.style.overflow = "";
          }
        }
      });
    });

    observer.observe(dialogNode, { attributes: true });

    return () => {
      observer.disconnect();
      document.body.style.overflow = "";
    };
  }, [ref]);

  if (!modalRoot) {
    console.error(
      "The element with the ID 'modal-root' was not found in the DOM.",
    );
    return null;
  }

  const handleCloseClick = () => {
    if (onCloseClick) onCloseClick();
    else if (ref && "current" in ref && ref.current) ref.current.close();
  };

  // Light-dismiss: clicking outside the content (on the ::backdrop) closes the
  // modal, behaving exactly like the top-right close button. `e.target` equals
  // the <dialog> only for backdrop hits — content clicks target the padded
  // wrapper or its children.
  const handleBackdropPointerDown = (
    e: React.MouseEvent<HTMLDialogElement>,
  ) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget && pointerDownOnBackdrop.current) {
      handleCloseClick();
    }
    pointerDownOnBackdrop.current = false;
  };

  const hasHeader =
    showClose || (rightActions && rightActions.length > 0) || title;

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onCancel}
      onMouseDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
      className={`
                    m-auto w-screen md:w-[90vw] max-w-112.5
                    rounded-[var(--r-card)] border border-app-border bg-app-surface/85 text-app-text
                    shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur-[20px]
                    backdrop:bg-black/45 backdrop:backdrop-blur-sm
                    open:animate-[modalFadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]
                    focus:outline-none
                    ${className}
                `}
    >
      {/* Padded content wrapper — keeps the whole box clickable so only the
          surrounding ::backdrop triggers light-dismiss. */}
      <div className="p-6">
        {/* Header: title (left) + subtitle · secondary actions + close X (right) */}
        {hasHeader && (
          <div className="mb-5 flex items-start justify-between gap-4">
            {/* Left: title + subtitle */}
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="m-0 truncate text-lg font-bold tracking-tight text-app-text [&>svg]:mr-2 [&>svg]:align-[-1px]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm font-medium text-app-muted">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Right: secondary actions, then the close button */}
            <div className="flex shrink-0 items-center gap-1">
              {rightActions && rightActions.length > 0 && (
                <ModalDialogRightAction actions={rightActions} />
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={handleCloseClick}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-[var(--r-sm)] bg-app-input text-app-muted transition-colors hover:bg-app-hover hover:text-app-text"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div>{children}</div>

        {/* Footer CTA row */}
        {footer && <div className="mt-7">{footer}</div>}
      </div>
    </dialog>,
    modalRoot,
  );
};
