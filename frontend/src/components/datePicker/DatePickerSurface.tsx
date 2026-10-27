import React from "react";
import { createPortal } from "react-dom";

export interface DatePickerSurfaceProps {
  isMobile: boolean;
  isRange: boolean;
  isDark: boolean;
  mobileDialogRef: React.RefObject<HTMLDialogElement | null>;
  modalRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  dropdownAlign: "left" | "center" | "right";
  dropdownPosition: "top" | "bottom";
  children: React.ReactNode;
}

const borderMain = "border-app-border";

/**
 * Container of the open picker: a bottom-sheet native `<dialog>` portalled to
 * `document.body` on mobile, an absolutely positioned popover on desktop.
 */
export default function DatePickerSurface({
  isMobile,
  isRange,
  isDark,
  mobileDialogRef,
  modalRef,
  onClose,
  dropdownAlign,
  dropdownPosition,
  children,
}: DatePickerSurfaceProps) {
  const bgMain = isDark ? "bg-app-card" : "bg-app-bg";

  if (isMobile && typeof document !== "undefined") {
    return createPortal(
      <dialog
        ref={mobileDialogRef}
        onClose={onClose}
        onClick={(e) => {
          // Close when clicking the transparent backdrop
          if (e.target === e.currentTarget) onClose();
        }}
        // Native ::backdrop instead of an overlay div
        className="m-0 p-0 w-full h-full max-w-none max-h-none theme-bg-transparent backdrop:theme-bg-backdrop-dark open:flex open:flex-col open:justify-end sm:hidden z-[100]"
      >
        <div
          ref={modalRef}
          className={`relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl pb-6 shadow-2xl border-t flex flex-col ${bgMain} ${borderMain} animate-[slideUp_0.3s_ease-out]`}
        >
          {children}
        </div>
      </dialog>,
      document.body,
    );
  }

  let alignClasses = "left-1/2 -translate-x-1/2";
  if (dropdownAlign === "left") alignClasses = "left-0";
  if (dropdownAlign === "right") alignClasses = "right-0";

  const positionClasses =
    dropdownPosition === "top" ? "bottom-full mb-4" : "top-full mt-4";

  return (
    <div
      ref={modalRef}
      className={`absolute ${positionClasses} ${alignClasses} transform rounded-xl shadow-2xl border flex flex-col sm:flex-row z-[100] ${isRange ? "w-[380px] sm:w-auto sm:min-w-[550px]" : "w-[320px]"} overflow-hidden ${bgMain} ${borderMain}`}
    >
      {children}
    </div>
  );
}
