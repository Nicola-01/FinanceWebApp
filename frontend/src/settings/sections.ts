import {
  faUser,
  faShieldAlt,
  faCode,
  faBell,
  faInfoCircle,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface SettingsSectionDef {
  id: string;
  label: string;
  icon: IconDefinition;
  description?: string;
  /** Renders the section header (and nav accent) in the danger colour. */
  danger?: boolean;
}

/**
 * Single source of truth for the settings sections — consumed by both the
 * settings page (nav + rendering) and the AppHeader dropdown (deep-links to
 * `/settings#<id>`), so the two never drift.
 */
export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: "account",
    label: "Account",
    icon: faUser,
    description: "Your profile details",
  },
  {
    id: "security",
    label: "Security",
    icon: faShieldAlt,
    description: "Password, two-factor authentication and active sessions",
  },
  {
    id: "tokens",
    label: "Tokens & Connections",
    icon: faCode,
    description: "API tokens and connected MCP apps",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: faBell,
    description: "Push notifications and activity alerts",
  },
  {
    id: "about",
    label: "About",
    icon: faInfoCircle,
    description: "App version and build",
  },
  {
    id: "delete-account",
    label: "Delete account",
    icon: faTrash,
    description: "Permanently delete your account and all data",
    danger: true,
  },
];

export const SETTINGS_SECTION_IDS = SETTINGS_SECTIONS.map((s) => s.id);
