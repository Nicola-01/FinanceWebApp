import React, { lazy, Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
// @ts-expect-error virtual module from vite-plugin-pwa
import { useRegisterSW } from "virtual:pwa-register/react";
import Button from "./Button";
import { useUiVersion } from "../../hooks/useUiVersion";

const PWAUpdateDrawer = lazy(() => import("./PWAUpdateDrawer"));

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

  const [ui] = useUiVersion();

  // ui-v2-switch: bottom sheet, lazy because the main chunk sits near the 2 MiB precache cap.
  // shortcut: unmounts on close, so there's no exit animation; keep it mounted if that matters.
  if (ui === "v2") {
    if (!needRefresh) return null;
    return (
      <Suspense fallback={null}>
        <PWAUpdateDrawer
          onReload={() => updateServiceWorker(true)}
          onLater={() => setNeedRefresh(false)}
        />
      </Suspense>
    );
  }

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-[999] w-11/12 max-w-sm -translate-x-1/2 flex flex-col sm:flex-row items-center gap-4 p-4 rounded-[var(--r-card)] animate-[slideUp_0.3s_ease-out] bg-app-card border border-app-border shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]"
    >
      {/* Global prompt (outside any wallet) → brand-gradient accent in v1. */}
      <span
        aria-hidden="true"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-input)] text-white bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)]"
      >
        <FontAwesomeIcon icon={faArrowsRotate} />
      </span>

      <div className="flex-1 text-center sm:text-left">
        <p className="text-sm text-app-text font-bold">App update</p>
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
