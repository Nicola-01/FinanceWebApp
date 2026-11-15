import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CircleCheckIcon, OctagonXIcon } from "lucide-react";
import { toast, Toaster } from "@/components/shadcn/sonner";
import { registerToastHandler } from "./ToastNotification";

// Sonner-based toast host (UI v2). Loaded lazily by ToastHost.
export default function SonnerToastHost() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      registerToastHandler(({ message, success, action }) => {
        const fire = success ? toast.success : toast.error;
        if (action)
          fire(message, {
            duration: 6000,
            action: { label: action.label, onClick: action.onClick },
          });
        else fire(message);
        // Re-raise the wrapper into the top layer so toasts sit above any open <dialog>.
        try {
          wrapperRef.current?.hidePopover?.();
          wrapperRef.current?.showPopover?.();
        } catch {
          console.warn("Popover API not supported by this browser");
        }
      }),
    [],
  );

  return createPortal(
    <div
      ref={wrapperRef}
      popover="manual"
      className="m-0 h-0 w-0 overflow-visible border-0 bg-transparent p-0"
    >
      <Toaster
        position="top-center"
        duration={3000}
        icons={{
          success: (
            <CircleCheckIcon
              aria-hidden="true"
              className="size-4 text-app-income"
            />
          ),
          error: (
            <OctagonXIcon
              aria-hidden="true"
              className="size-4 text-app-danger"
            />
          ),
        }}
        style={
          {
            "--normal-bg": "var(--color-app-card)",
            "--normal-text": "var(--color-app-text)",
            "--normal-border": "var(--color-app-border)",
            "--border-radius": "var(--r-card)",
          } as React.CSSProperties
        }
        toastOptions={{
          classNames: {
            toast: "font-sans shadow-[0_8px_24px_rgb(0_0_0/0.25)]",
          },
        }}
      />
    </div>,
    document.getElementById("toast-root")!,
  );
}
