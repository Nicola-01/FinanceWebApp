import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { Drawer } from "@base-ui/react/drawer";
import Button from "./Button";

interface PWAUpdateDrawerProps {
  onReload: () => void;
  onLater: () => void;
}

/** v2 "App update" bottom sheet, above the bottom nav (z-[1100]). Lazy-loaded by PWAPrompt. */
const PWAUpdateDrawer: React.FC<PWAUpdateDrawerProps> = ({
  onReload,
  onLater,
}) => (
  <Drawer.Root
    open
    onOpenChange={(open) => {
      if (!open) onLater();
    }}
  >
    <Drawer.Portal>
      <Drawer.Backdrop className="fixed inset-0 z-[1200] min-h-dvh bg-black/40 transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-starting-style:opacity-0 data-ending-style:opacity-0" />
      <Drawer.Viewport className="fixed inset-0 z-[1200] flex items-end justify-center">
        <Drawer.Popup className="w-full sm:mx-auto sm:max-w-md rounded-t-[var(--r-card)] bg-app-card text-app-text shadow-[0_-8px_24px_rgb(0_0_0/0.25)] px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-starting-style:[transform:translateY(calc(100%+2px))] data-ending-style:[transform:translateY(calc(100%+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-border"
          />
          <Drawer.Content className="text-center">
            <span
              aria-hidden="true"
              className="mx-auto grid h-10 w-10 place-items-center rounded-[var(--r-input)] bg-wallet text-on-wallet"
            >
              <FontAwesomeIcon icon={faArrowsRotate} />
            </span>
            <Drawer.Title className="mt-3 text-base font-semibold">
              App update
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-app-muted">
              A new version is ready. Refresh to apply.
            </Drawer.Description>
            <div className="mt-5 flex gap-2">
              <Button
                variant="primary"
                ripple
                className="flex-1"
                onClick={onReload}
              >
                Reload
              </Button>
              <Button variant="secondary" className="flex-1" onClick={onLater}>
                Later
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  </Drawer.Root>
);

export default PWAUpdateDrawer;
