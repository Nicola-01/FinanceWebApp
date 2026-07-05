import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
// @ts-expect-error virtual module from vite-plugin-pwa
import { useRegisterSW } from "virtual:pwa-register/react";
import Button from "./Button";

export const PWAPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl: string) {
      console.log("SW Registered:", swUrl);
    },
    onRegisterError(error: unknown) {
      console.error("SW Registration Error:", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[999] w-11/12 max-w-sm -translate-x-1/2 flex flex-col sm:flex-row items-center gap-4 p-4 bg-app-card border border-app-border rounded-[var(--r-card)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] animate-[slideUp_0.3s_ease-out]"
    >
      {/* Global prompt (outside any wallet) → brand-gradient accent. */}
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-input)] text-white bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)]"
      >
        <FontAwesomeIcon icon={faArrowsRotate} />
      </span>

      <div className="flex-1 text-center sm:text-left">
        <p className="text-sm font-bold text-app-text">App update</p>
        <p className="mt-1 text-xs text-app-muted">
          A new version is ready. Refresh to apply.
        </p>
      </div>

      <div className="flex w-full gap-2 sm:w-auto">
        <Button
          variant="primary"
          size="sm"
          ripple
          className="flex-1 sm:flex-none"
          onClick={() => updateServiceWorker(true)}
        >
          Reload
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={() => setNeedRefresh(false)}
        >
          Later
        </Button>
      </div>
    </div>
  );
};
