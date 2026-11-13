import React from "react";
import { createPortal } from "react-dom";
import { useUiVersion } from "../../hooks/useUiVersion";

export interface DatePickerSurfaceProps {
  isMobile: boolean;
  /** Range picker with the preset sidebar — sized wider to fit both columns. */
  withSidebar: boolean;
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
  withSidebar,
  isDark,
  mobileDialogRef,
  modalRef,
  onClose,
  dropdownAlign,
  dropdownPosition,
  children,
}: DatePickerSurfaceProps) {
  const [ui] = useUiVersion();
  // ui-v2-switch: v2 popovers are flat app-card boxes with a soft shadow, no border.
  const isV2 = ui === "v2";
  const bgMain = isDark ? "bg-app-card" : "bg-app-bg";
  const v2Shadow = "shadow-[0_8px_24px_rgb(0_0_0/0.25),var(--box-ring)]";

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
        className={`m-0 p-0 w-full h-full max-w-none max-h-none theme-bg-transparent ${
          // ui-v2-switch
          isV2 ? "backdrop:bg-black/45" : "backdrop:theme-bg-backdrop-dark"
        } open:flex open:flex-col open:justify-end sm:hidden z-[100]`}
      >
        <div
          ref={modalRef}
          className={
            // ui-v2-switch
            isV2
              ? `relative w-full max-h-[85vh] overflow-y-auto rounded-t-[var(--r-card)] pb-6 ${v2Shadow} flex flex-col bg-app-card animate-[slideUp_0.3s_ease-out]`
              : `relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl pb-6 shadow-2xl border-t flex flex-col ${bgMain} ${borderMain} animate-[slideUp_0.3s_ease-out]`
          }
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
      className={
        // ui-v2-switch
        isV2
          ? `absolute ${positionClasses} ${alignClasses} transform rounded-[var(--r-card)] ${v2Shadow} flex flex-col sm:flex-row z-[100] ${withSidebar ? "w-[380px] sm:w-auto sm:min-w-[550px]" : "w-[320px]"} overflow-hidden bg-app-card`
          : `absolute ${positionClasses} ${alignClasses} transform rounded-xl shadow-2xl border flex flex-col sm:flex-row z-[100] ${withSidebar ? "w-[380px] sm:w-auto sm:min-w-[550px]" : "w-[320px]"} overflow-hidden ${bgMain} ${borderMain}`
      }
    >
      {children}
    </div>
  );
}
