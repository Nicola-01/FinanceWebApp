import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { SettingsSectionDef } from "./sections";
import { useUiVersion } from "../hooks/useUiVersion";

interface SettingsNavProps {
  sections: SettingsSectionDef[];
  activeId: string;
  onNavigate: (id: string) => void;
}

/**
 * Section navigation for the settings page. On desktop (lg+) it is a vertical
 * list meant to be wrapped in a sticky container; on mobile it collapses to a
 * horizontally-scrollable row of chips.
 */
export const SettingsNav: React.FC<SettingsNavProps> = ({
  sections,
  activeId,
  onNavigate,
}) => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  return (
    <nav aria-label="Settings sections">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 custom-scrollbar">
        {sections.map((s) => {
          const active = s.id === activeId;
          const icon = (
            <FontAwesomeIcon
              icon={s.icon}
              className={
                active
                  ? isV2
                    ? s.danger
                      ? "text-app-danger"
                      : ""
                    : s.danger
                      ? "text-app-red"
                      : "text-[var(--brand-1)]"
                  : ""
              }
            />
          );
          return (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onNavigate(s.id)}
                aria-current={active ? "true" : undefined}
                className={
                  isV2
                    ? // ui-v2-switch: quiet 14px items, raised fill when active.
                      `flex w-full items-center gap-2.5 rounded-[var(--r-input)] px-3 py-2 text-[14px] font-medium whitespace-nowrap transition-colors ${
                        active
                          ? "bg-app-raised text-app-text"
                          : "text-app-muted hover:text-app-text"
                      }`
                    : `flex w-full items-center gap-2.5 rounded-[var(--r-input)] px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                        active
                          ? "bg-app-input text-app-text"
                          : "text-app-muted hover:bg-app-hover hover:text-app-text"
                      }`
                }
              >
                {/* ui-v2-switch: fixed-width icon well keeps labels aligned. */}
                {isV2 ? (
                  <span className="flex w-4 shrink-0 justify-center">
                    {icon}
                  </span>
                ) : (
                  icon
                )}
                {s.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
