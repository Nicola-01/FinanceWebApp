import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faPause,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import type { PatToken } from "../../types/domain";
import { useUiVersion } from "../../hooks/useUiVersion";

interface TokenActionButtonsProps {
  token: PatToken;
  onEdit?: (token: PatToken) => void;
  onDelete?: (token: PatToken) => void;
  /** Toggles paused ↔ active. When provided, a pause/resume button is shown. */
  onPauseToggle?: (token: PatToken) => void;
  revokingId?: string | null;
  pausingId?: string | null;
}

export const TokenActionButtons: React.FC<TokenActionButtonsProps> = ({
  token,
  onEdit,
  onDelete,
  onPauseToggle,
  revokingId,
  pausingId,
}) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: quiet icon buttons; hover uses the raised fill and a status text colour.
  const isV2 = ui === "v2";
  const iconBase = isV2
    ? "text-app-muted transition-all hover:bg-app-raised"
    : "text-app-muted/50 transition-all";
  return (
    <div className="flex shrink-0 gap-2">
      {onPauseToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPauseToggle(token);
          }}
          disabled={pausingId === token.id}
          className={`flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40 ${iconBase} ${isV2 ? "hover:text-app-warn" : "hover:bg-app-yellow/15 hover:text-app-yellow"}`}
          title={token.paused ? "Resume token" : "Pause token"}
        >
          <FontAwesomeIcon
            icon={token.paused ? faPlay : faPause}
            className={`text-xs ${pausingId === token.id ? "animate-pulse" : ""}`}
          />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(token);
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBase} ${isV2 ? "hover:text-app-text" : "hover:bg-app-purple/15 hover:text-app-purple"}`}
          title="Edit permissions"
        >
          <FontAwesomeIcon icon={faPen} className="text-xs" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(token);
          }}
          disabled={revokingId === token.id}
          className={`flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40 ${iconBase} ${isV2 ? "hover:text-app-danger" : "hover:bg-app-red/15 hover:text-app-red"}`}
          title="Revoke Token"
        >
          <FontAwesomeIcon
            icon={faTrash}
            className={`text-xs ${revokingId === token.id ? "animate-pulse" : ""}`}
          />
        </button>
      )}
    </div>
  );
};
