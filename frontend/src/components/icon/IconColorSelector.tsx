import React, { useState } from "react";
import type { IconKey } from "../../utils/icons.ts";
import { IconSelector } from "./IconSelector.tsx";
import { ColorSelector } from "../selectors/ColorSelector";
import { useUiVersion } from "../../hooks/useUiVersion.ts";

interface ColorSelectorPropsProps {
  ref?: React.Ref<HTMLDivElement>;
  iconValue: IconKey;
  onChangeIcon: (icon: IconKey) => void;
  colorValue: string;
  onChangeColor: (color: string) => void;
}

export const IconColorSelector = ({
  ref,
  iconValue,
  onChangeIcon,
  colorValue,
  onChangeColor,
}: ColorSelectorPropsProps) => {
  const [activeTab, setActiveTab] = useState<"icons" | "colors">("icons");
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  // v2 tab classes: sentence case, raised track with a card-coloured active segment.
  const tabClass = (active: boolean) =>
    v2
      ? `flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${active ? "bg-app-card text-app-text shadow-sm" : "text-app-muted hover:text-app-text"}`
      : `flex-1 rounded-md py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${active ? "bg-app-surface text-app-text shadow-sm" : "text-app-muted hover:text-app-text"}`;

  return (
    <div
      ref={ref}
      // Self-contained block (no absolute positioning); the parent portal
      // positions it. Scrolls if the colours tab grows (advanced panel open).
      className={`custom-scrollbar flex max-h-[80vh] w-[260px] flex-col items-center gap-4 overflow-y-auto p-4 animate-[fadeIn_0.2s_ease-out] ${
        v2
          ? "rounded-[var(--r-card)] bg-app-card shadow-[0_8px_24px_rgb(0_0_0/0.25),var(--box-ring)]"
          : "rounded-[var(--r-card)] border border-app-border bg-app-card shadow-2xl"
      }`}
    >
      <div
        className={`flex w-full shrink-0 rounded-lg p-1 ${v2 ? "bg-app-raised" : "bg-app-input"}`}
      >
        <button
          type="button"
          className={tabClass(activeTab === "icons")}
          onClick={() => setActiveTab("icons")}
        >
          Icons
        </button>
        <button
          type="button"
          className={tabClass(activeTab === "colors")}
          onClick={() => setActiveTab("colors")}
        >
          Colors
        </button>
      </div>

      <div className="flex w-full justify-center">
        {activeTab === "icons" ? (
          <IconSelector
            value={iconValue}
            onChange={onChangeIcon}
            currentColor={colorValue}
          />
        ) : (
          <ColorSelector value={colorValue} onChange={onChangeColor} />
        )}
      </div>
    </div>
  );
};
