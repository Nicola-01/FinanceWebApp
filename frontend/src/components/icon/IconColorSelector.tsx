import React, { useState } from "react";
import type { IconKey } from "../../utils/icons.ts";
import { IconSelector } from "./IconSelector.tsx";
import { ColorSelector } from "../selectors/ColorSelector";

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

  return (
    <div
      ref={ref}
      // Self-contained block (no absolute positioning); the parent portal
      // positions it. Scrolls if the colours tab grows (advanced panel open).
      className="custom-scrollbar flex max-h-[80vh] w-[260px] flex-col items-center gap-4 overflow-y-auto rounded-[var(--r-card)] border border-app-border bg-app-card p-4 shadow-2xl animate-[fadeIn_0.2s_ease-out]"
    >
      <div className="flex w-full shrink-0 rounded-lg bg-app-input p-1">
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === "icons" ? "bg-app-surface text-app-text shadow-sm" : "text-app-muted hover:text-app-text"}`}
          onClick={() => setActiveTab("icons")}
        >
          Icons
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === "colors" ? "bg-app-surface text-app-text shadow-sm" : "text-app-muted hover:text-app-text"}`}
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
