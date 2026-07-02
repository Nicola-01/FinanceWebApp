import { forwardRef, useImperativeHandle, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "../common/ModalDialog";

export interface AboutAppModalHandle {
  openModal: () => void;
}

export const AboutAppModal = forwardRef<AboutAppModalHandle>((_props, ref) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => ({
    openModal: () => {
      dialogRef.current?.showModal();
    },
  }));

  const appVersion = import.meta.env.VITE_APP_VERSION || "Local Development";

  let parsedDate = "Unknown";
  if (import.meta.env.VITE_APP_BUILD_DATE) {
    try {
      const dateObj = new Date(import.meta.env.VITE_APP_BUILD_DATE);
      parsedDate = dateObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      parsedDate = import.meta.env.VITE_APP_BUILD_DATE;
    }
  }

  return (
    <ModalDialog
      ref={dialogRef}
      className="max-w-[380px]"
      title={
        <>
          <FontAwesomeIcon icon={faInfoCircle} className="text-app-sky" /> About
        </>
      }
    >
      <div className="flex flex-col items-center pb-4 pt-2 text-center">
        <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-app-surface border border-app-border shadow-sm">
          <img
            src="/icon.svg"
            alt="App Logo"
            className="h-12 w-12 object-contain hover:scale-105 transition-transform"
          />
        </div>

        <h3 className="mb-1 text-xl font-bold tracking-wide text-app-text">
          Finance
          <span className="animate-gradient-x bg-gradient-to-r theme-gradient-primary-from theme-gradient-brand-via theme-gradient-brand-to bg-clip-text theme-text-transparent">
            App
          </span>
        </h3>

        <p className="mb-6 text-sm text-app-muted">
          Advanced financial dashboard tracking.
        </p>

        <div className="w-full space-y-3 rounded-xl border border-app-border bg-app-input p-4 text-left shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
              Version
            </span>
            <span className="rounded bg-[var(--color-app-sky)]/10 px-2 py-0.5 text-xs font-bold font-mono text-app-sky">
              {appVersion}
            </span>
          </div>

          <div className="h-px w-full bg-app-border" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
              Published On
            </span>
            <span className="text-xs font-semibold text-app-text text-right max-w-[150px] leading-tight">
              {parsedDate}
            </span>
          </div>
        </div>

        <div className="mt-6 text-[10px] text-app-muted/50 uppercase tracking-widest font-bold">
          Made by Nicola &copy; {new Date().getFullYear()}
        </div>
      </div>
    </ModalDialog>
  );
});
