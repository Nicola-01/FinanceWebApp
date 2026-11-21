import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useUiVersion } from "../../hooks/useUiVersion";
import Button from "../../components/ui/Button";
import { cn } from "../../lib/utils";

export const IconAction: React.FC<{
  icon: IconDefinition;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  spin?: boolean;
  danger?: boolean;
}> = ({ icon, onClick, label, disabled, spin, danger }) => {
  const [ui] = useUiVersion();
  // ui-v2-switch: shared ghost icon button (v1 keeps its own markup).
  if (ui === "v2") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={cn("shrink-0", danger && "hover:text-app-danger")}
      >
        <FontAwesomeIcon icon={icon} spin={spin} />
      </Button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-sm transition-colors disabled:opacity-40 ${
        danger
          ? "text-app-muted hover:bg-app-hover hover:text-app-red"
          : "text-app-muted hover:bg-app-hover hover:text-app-text"
      }`}
    >
      <FontAwesomeIcon icon={icon} spin={spin} />
    </button>
  );
};
