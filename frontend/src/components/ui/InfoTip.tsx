import React from "react";
import { Popover } from "@base-ui/react/popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

/**
 * Small "i" button that explains something: opens on hover (desktop) and on tap (touch).
 * A Popover, not a Tooltip, so it also works on phones and can hold a few sentences.
 */
export const InfoTip: React.FC<{
  /** Accessible name of the trigger, e.g. "How the range is computed". */
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className = "" }) => (
  <Popover.Root>
    <Popover.Trigger
      openOnHover
      delay={150}
      aria-label={label}
      className={`inline-grid h-6 w-6 place-items-center rounded-full text-[13px] text-app-faint outline-none transition-colors hover:text-app-text focus-visible:ring-2 focus-visible:ring-wallet/40 ${className}`}
    >
      <FontAwesomeIcon icon={faCircleInfo} />
    </Popover.Trigger>
    <Popover.Portal>
      {/* Above sticky tabs/overlays (90–95), below the bottom dock's menu and toasts. */}
      <Popover.Positioner sideOffset={6} className="z-[100]">
        <Popover.Popup className="max-w-[min(20rem,calc(100vw-2rem))] rounded-[var(--r-input)] border border-app-border bg-app-raised px-3.5 py-3 text-[13px] leading-relaxed text-app-text shadow-[0_16px_40px_-12px_rgb(0_0_0/0.5)] outline-none">
          {children}
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  </Popover.Root>
);
