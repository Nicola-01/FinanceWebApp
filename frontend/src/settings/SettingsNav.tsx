import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface SettingsSectionDef {
  id: string;
  label: string;
  icon: IconDefinition;
  description?: string;
  /** Renders the section header (and nav accent) in the danger colour. */
  danger?: boolean;
}

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
  return (
    <nav aria-label="Settings sections">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 custom-scrollbar">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onNavigate(s.id)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-2.5 rounded-[var(--r-input)] px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-app-input text-app-text"
                    : "text-app-muted hover:bg-app-hover hover:text-app-text"
                }`}
              >
                <FontAwesomeIcon
                  icon={s.icon}
                  className={
                    active
                      ? s.danger
                        ? "text-app-red"
                        : "text-[var(--brand-1)]"
                      : ""
                  }
                />
                {s.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
