import React from "react";
import { Popover } from "@base-ui/react/popover";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import type { TagDropdownPanelProps } from "./TagDropdownPanel.tsx";

/** Base UI Popover implementation of TagDropdownPanel; code-split via the lazy wrapper. */
export const TagDropdownPopover: React.FC<TagDropdownPanelProps> = ({
  anchorRef,
  onClose,
  align = "start",
  className = "",
  searchSlot,
  headerSlot,
  children,
}) => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch: borderless card with the soft floating shadow
  return (
    <Popover.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      {/* Portal INTO the anchor wrapper: keeps useTagTree's outside-click check working and stays inside native <dialog> top layer. */}
      <Popover.Portal container={anchorRef}>
        {/* bottom 80 leaves room for the phone bottom dock. */}
        <Popover.Positioner
          anchor={anchorRef}
          side="bottom"
          align={align}
          sideOffset={6}
          collisionPadding={{ top: 12, left: 12, right: 12, bottom: 80 }}
          className="z-[100]"
        >
          <Popover.Popup
            initialFocus={false}
            finalFocus={false}
            className={`flex max-h-[min(350px,var(--available-height))] flex-col p-2 outline-none animate-[fadeIn_0.1s_ease-out] ${
              v2
                ? "rounded-[var(--r-card)] bg-app-card shadow-[0_8px_24px_rgb(0_0_0/0.25),var(--box-ring)]"
                : "rounded-xl border border-app-border bg-app-card shadow-2xl"
            } ${className}`}
          >
            {searchSlot && <div className="mb-2 shrink-0">{searchSlot}</div>}
            {headerSlot && (
              <div
                className={`mb-1 shrink-0 pb-1 ${v2 ? "" : "border-b border-app-border"}`}
              >
                {headerSlot}
              </div>
            )}
            <div className="custom-scrollbar min-h-[50px] flex-1 space-y-1 overflow-y-auto pr-1">
              {children}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
