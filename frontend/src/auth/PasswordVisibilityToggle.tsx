import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

/** Eye toggle for an auth-screen password `Input` rightSlot. */
export const PasswordVisibilityToggle: React.FC<{
  visible: boolean;
  onToggle: () => void;
}> = ({ visible, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex items-center rounded-md p-2 text-app-muted transition-colors hover:text-app-text"
    aria-label={visible ? "Hide password" : "Show password"}
  >
    <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
  </button>
);
