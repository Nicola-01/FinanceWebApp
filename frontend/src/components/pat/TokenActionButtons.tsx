import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faPen,
  faTrash,
  faPause,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import type { PatToken } from "../../types/domain";
import { useUiVersion } from "../../hooks/useUiVersion";
import Button from "../ui/Button";

interface TokenActionButtonsProps {
  token: PatToken;
  onEdit?: (token: PatToken) => void;
  onDelete?: (token: PatToken) => void;
  /** Toggles paused ↔ active. When provided, a pause/resume button is shown. */
  onPauseToggle?: (token: PatToken) => void;
  revokingId?: string | null;
  pausingId?: string | null;
}

interface ActionProps {
  isV2: boolean;
  title: string;
  icon: IconDefinition;
  iconClassName?: string;
  onClick: () => void;
  disabled?: boolean;
  /** v1 hover tint (background + text). */
  v1Hover: string;
  /** v2 hover text tint; the raised fill comes from the ghost variant. */
  v2Hover: string;
}

const Action: React.FC<ActionProps> = ({
  isV2,
  title,
  icon,
  iconClassName = "text-xs",
  onClick,
  disabled,
  v1Hover,
  v2Hover,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  // ui-v2-switch: shared ghost icon button with a danger/warn text hover.
  if (isV2) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        className={`h-8 w-8 ${v2Hover}`}
      >
        <FontAwesomeIcon icon={icon} className={iconClassName} />
      </Button>
    );
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40 text-app-muted/50 transition-all ${v1Hover}`}
      title={title}
    >
      <FontAwesomeIcon icon={icon} className={iconClassName} />
    </button>
  );
};

export const TokenActionButtons: React.FC<TokenActionButtonsProps> = ({
  token,
  onEdit,
  onDelete,
  onPauseToggle,
  revokingId,
  pausingId,
}) => {
  const [ui] = useUiVersion();
  const isV2 = ui === "v2";
  return (
    <div className="flex shrink-0 gap-2">
      {onPauseToggle && (
        <Action
          isV2={isV2}
          title={token.paused ? "Resume token" : "Pause token"}
          icon={token.paused ? faPlay : faPause}
          iconClassName={`text-xs ${pausingId === token.id ? "animate-pulse" : ""}`}
          onClick={() => onPauseToggle(token)}
          disabled={pausingId === token.id}
          v1Hover="hover:bg-app-yellow/15 hover:text-app-yellow"
          v2Hover="hover:text-app-warn"
        />
      )}
      {onEdit && (
        <Action
          isV2={isV2}
          title="Edit permissions"
          icon={faPen}
          onClick={() => onEdit(token)}
          v1Hover="hover:bg-app-purple/15 hover:text-app-purple"
          v2Hover="hover:text-app-text"
        />
      )}
      {onDelete && (
        <Action
          isV2={isV2}
          title="Revoke Token"
          icon={faTrash}
          iconClassName={`text-xs ${revokingId === token.id ? "animate-pulse" : ""}`}
          onClick={() => onDelete(token)}
          disabled={revokingId === token.id}
          v1Hover="hover:bg-app-red/15 hover:text-app-red"
          v2Hover="hover:text-app-danger"
        />
      )}
    </div>
  );
};
