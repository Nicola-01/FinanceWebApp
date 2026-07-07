import { type JSX } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faPen } from "@fortawesome/free-solid-svg-icons";
import { Selector } from "./Selector";

/** The two per-wallet roles a member/invite can hold. */
export type WalletRole = "VIEWER" | "EDITOR";

export interface RoleSelectorProps {
  value: WalletRole;
  onChange: (role: WalletRole) => void;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  /**
   * Render icon-only pills (no text label) for tight, content-width switches —
   * e.g. the wizard's staged-invite rows. The role name still backs the button
   * as its accessible name / tooltip.
   */
  iconOnly?: boolean;
}

/**
 * Shared VIEWER / EDITOR toggle. Single source of truth for the eye/pen icons
 * and the neutral active styling used by the invite composer, the settings
 * member rows and the wizard's staged-invite list, so the control looks
 * identical everywhere.
 */
export function RoleSelector({
  value,
  onChange,
  size = "sm",
  fullWidth = false,
  className = "",
  iconOnly = false,
}: RoleSelectorProps): JSX.Element {
  return (
    <Selector<WalletRole>
      value={value}
      onChange={onChange}
      size={size}
      fullWidth={fullWidth}
      className={className}
      options={[
        {
          value: "VIEWER",
          label: iconOnly ? undefined : "Viewer",
          title: iconOnly ? "Viewer" : undefined,
          icon: <FontAwesomeIcon icon={faEye} />,
          activeBgClass: "bg-app-surface",
          activeColorClass: "text-app-text",
        },
        {
          value: "EDITOR",
          label: iconOnly ? undefined : "Editor",
          title: iconOnly ? "Editor" : undefined,
          icon: <FontAwesomeIcon icon={faPen} />,
          activeBgClass: "bg-app-surface",
          activeColorClass: "text-app-text",
        },
      ]}
    />
  );
}

export default RoleSelector;
