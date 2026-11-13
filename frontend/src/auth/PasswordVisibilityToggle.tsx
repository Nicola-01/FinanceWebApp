import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useUiVersion } from "../hooks/useUiVersion";

/** Eye toggle for an auth-screen password `Input` rightSlot. */
export const PasswordVisibilityToggle: React.FC<{
  visible: boolean;
  onToggle: () => void;
}> = ({ visible, onToggle }) => {
  const [ui] = useUiVersion();
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center p-2 text-app-muted transition-colors hover:text-app-text ${
        // ui-v2-switch: squared radius from the v2 scale.
        ui === "v2" ? "rounded-[var(--r-sm)]" : "rounded-md"
      }`}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
    </button>
  );
};
