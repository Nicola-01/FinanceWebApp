import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { createPortal } from "react-dom";

interface ToastData {
  message: string;
  success: boolean;
}

let toastEvent: ((data: ToastData) => void) | null = null;
const TIMEOUT_DURATION = 3000;

export const triggerToast = (message: string, success: boolean) => {
  toastEvent?.({ message, success });
};

export const ToastNotification: React.FC = () => {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<ToastData>({ message: "", success: true });

  const timerRef = useRef<number | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  // RIMOSSO l'useEffect che apriva il popover al mount della pagina

  useEffect(() => {
    const handleTrigger = (newData: ToastData) => {
      setData(newData);
      setShow(true);

      // --- FIX: RIPOSIZIONA IL TOAST IN CIMA AL TOP LAYER ---
      if (toastRef.current) {
        try {
          // Se è già aperto, lo chiudiamo prima per resettare l'ordine di stacking
          if (toastRef.current.matches(":popover-open")) {
            toastRef.current.hidePopover();
          }
          // Lo apriamo portandolo sopra a qualsiasi <dialog> attivo!
          toastRef.current.showPopover();
        } catch (e) {
          console.warn("Popover API not supported by this browser");
        }
      }
      // --------------------------------------------------------

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        setShow(false);
      }, TIMEOUT_DURATION);
    };

    toastEvent = handleTrigger;

    return () => {
      toastEvent = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return createPortal(
    <div
      ref={toastRef}
      popover="manual"
      className={`
                fixed top-5 left-1/2 z-9999
                flex items-center gap-3 px-6 py-3
                min-w-75 w-fit max-w-[95vw]
                rounded-xl border backdrop-blur-md
                font-semibold tracking-wide shadow-2xl m-0
                transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                
                ${
                  show
                    ? "opacity-100 -translate-x-1/2 translate-y-0 visible pointer-events-auto"
                    : "opacity-0 -translate-x-1/2 translate-y-5 invisible pointer-events-none"
                }

                ${
                  data.success
                    ? "theme-bg-success-transparent theme-border-success-strong theme-text-success shadow-[0_0_15px_rgb(var(--app-green)/0.2)]"
                    : "theme-bg-danger-light theme-border-danger-light theme-text-danger shadow-[0_0_15px_rgb(var(--app-red)/0.2)]"
                }
            `}
    >
      <div className={`text-lg drop-shadow-[0_0_5px_rgba(currentColor,0.6)]`}>
        <FontAwesomeIcon icon={data.success ? faCheck : faXmark} />
      </div>

      <span>{data.message}</span>
    </div>,
    document.getElementById("toast-root")!,
  );
};
