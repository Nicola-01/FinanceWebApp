import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from "../../utils/icons.ts";

interface WalletIconProps {
  icon: string; // Icon key from the backend (e.g. "piggyBank")
  color?: string; // Hex colour (optional, inherits from parent by default)
  className?: string; // Optional Tailwind classes for sizing/spacing
}

export const Icon: React.FC<WalletIconProps> = ({
  icon,
  color,
  className = "",
}) => {
  // Unknown keys fall back to 'wallet'.
  const selectedIcon = ICONS[icon as IconKey] || ICONS["wallet"];

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ color: color || "inherit" }}
    >
      <FontAwesomeIcon icon={selectedIcon} />
    </span>
  );
};
