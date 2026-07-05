import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";
import { registerToastHandler, type ToastData } from "./ToastNotification";

const TIMEOUT_DURATION = 3000;

export const ToastHost: React.FC = () => {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<ToastData>({ message: "", success: true });

  const timerRef = useRef<number | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTrigger = (newData: ToastData) => {
      setData(newData);
      setShow(true);

      // Re-raise the toast to the top layer so it sits above any open <dialog>.
      if (toastRef.current) {
        try {
          // If it's already open, close it first to reset the stacking order.
          if (toastRef.current.matches(":popover-open")) {
            toastRef.current.hidePopover();
          }
          // Re-open it so it renders above any active <dialog>.
          toastRef.current.showPopover();
        } catch {
          console.warn("Popover API not supported by this browser");
        }
      }

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setShow(false);
      }, TIMEOUT_DURATION);
    };

    const unregister = registerToastHandler(handleTrigger);

    return () => {
      unregister();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return createPortal(
    <div
      ref={toastRef}
      popover="manual"
      className={`
                fixed top-5 left-1/2 z-9999 m-0
                flex items-center gap-3 px-4 py-3
                min-w-75 w-fit max-w-[95vw]
                rounded-[var(--r-card)] border backdrop-blur-md
                bg-app-card/90 text-app-text font-semibold tracking-wide
                shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-20px_rgba(0,0,0,0.35)]
                transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]

                ${
                  show
                    ? "opacity-100 -translate-x-1/2 translate-y-0 visible pointer-events-auto"
                    : "opacity-0 -translate-x-1/2 translate-y-5 invisible pointer-events-none"
                }

                ${data.success ? "border-app-green/30" : "border-app-red/30"}
            `}
    >
      {/* Semantic tint on the chip only — depth comes from a neutral shadow, no coloured glow. */}
      <span
        aria-hidden="true"
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] text-sm ${
          data.success
            ? "bg-app-green/15 text-app-green"
            : "bg-app-red/15 text-app-red"
        }`}
      >
        <FontAwesomeIcon icon={data.success ? faCheck : faXmark} />
      </span>

      <span className="text-sm">{data.message}</span>
    </div>,
    document.getElementById("toast-root")!,
  );
};
