import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type IconKey, ICONS } from "../../utils/icons.ts";

interface WalletIconProps {
  icon: string; // La stringa che arriva dal backend (es. "piggyBank")
  color?: string; // Il colore hex (opzionale, di default eredita dal padre)
  className?: string; // Classi Tailwind opzionali per sizing/spacing
}

export const Icon: React.FC<WalletIconProps> = ({
  icon,
  color,
  className = "",
}) => {
  // Recupera l'icona dalla mappa. Se la stringa è invalida, usa 'wallet' come fallback sicuro.
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
