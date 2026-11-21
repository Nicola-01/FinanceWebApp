import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "../ui/Badge";
import {
  faKey,
  faArrowRight,
  faCopy,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import type { Wallet, PatToken } from "../../types/domain";
import { TokenActionButtons } from "./TokenActionButtons";
import { TokenWalletBadges } from "./TokenWalletBadges";
import { TokenLastUsedInfo } from "./TokenLastUsedInfo";
import { useLongPressSelect } from "./useLongPressSelect";
import { useUiVersion } from "../../hooks/useUiVersion";
import Button from "../ui/Button";

// ui-v2-switch: small inline icon action; v2 uses the shared ghost icon button.
const InlineIconButton: React.FC<{
  isV2: boolean;
  title: string;
  icon: typeof faEye;
  onClick: (e: React.MouseEvent) => void;
}> = ({ isV2, title, icon, onClick }) =>
  isV2 ? (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <FontAwesomeIcon icon={icon} />
    </Button>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-app-muted transition-colors hover:text-app-text"
      title={title}
      aria-label={title}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );

interface TokenListItemProps {
  token: PatToken;
  walletsMap: Record<string, Wallet>;
  onEdit?: (t: PatToken) => void;
  onDelete?: (t: PatToken) => void;
  onPauseToggle?: (t: PatToken) => void; // pause/resume button (already exists)
  revokingId?: string | null;
  pausingId?: string | null;
  badge?: React.ReactNode; // Manual/MCP pill from the parent
  // --- selection via long-press (NEW) ---
  selectionMode?: boolean; // true when >=1 row is selected app-wide
  selected?: boolean; // this row is selected
  onLongPressSelect?: (t: PatToken) => void; // fire after a 500ms press-and-hold
  onToggleSelect?: (t: PatToken) => void; // fire on a QUICK click while selectionMode is true
  // --- legacy onClick mode: no remaining consumer, still covered by tests ---
  onClick?: (t: PatToken) => void;
  disabled?: boolean;
  showActions?: boolean;
  showCopy?: boolean;
  onCopy?: (prefix: string) => void;
}

export const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  walletsMap,
  onEdit,
  onDelete,
  onPauseToggle,
  revokingId,
  pausingId,
  badge,
  selectionMode = false,
  selected = false,
  onLongPressSelect,
  onToggleSelect,
  onClick,
  disabled,
  showActions = true,
  showCopy = false,
  onCopy,
}) => {
  const isButtonVariant = !!onClick;
  // OAuth-managed MCP connections have no revealable prefix to show.
  const isMcp = token.name.trim().toLowerCase().startsWith("oauth:");

  const [revealed, setRevealed] = useState(false);
  const [ui] = useUiVersion();
  // ui-v2-switch
  const isV2 = ui === "v2";

  const longPressHandlers = useLongPressSelect(
    () => onLongPressSelect?.(token),
    () => {
      if (selectionMode) onToggleSelect?.(token);
    },
  );

  const Wrapper = isButtonVariant ? "button" : "div";
  const wrapperProps = isButtonVariant
    ? {
        onClick: () => onClick?.(token),
        disabled,
        type: "button" as const,
      }
    : longPressHandlers;

  return (
    <Wrapper
      {...wrapperProps}
      className={`group w-full text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        // ui-v2-switch: flat row inside the list's divide-y card; selection is the raised fill.
        isV2
          ? `min-h-14 rounded-[var(--r-card)] px-4 py-3 ${selected ? "bg-app-raised" : "hover:bg-app-raised"}`
          : `p-3.5 rounded-xl border ${selected ? "border-app-purple/60 bg-app-purple/5 ring-1 ring-app-purple/40" : "border-app-border bg-app-input hover:border-app-purple/50"}`
      } ${!isButtonVariant ? "select-none" : ""} ${!isButtonVariant && selectionMode ? "cursor-pointer" : ""} ${token.paused ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isV2 ? "bg-app-raised" : "bg-app-bg"}`}
          >
            <FontAwesomeIcon icon={faKey} className="text-lg text-app-muted" />
          </div>
          <div className="min-w-0">
            {/* Line 1: token name + parent badge + paused pill. */}
            <div className="flex items-center gap-2">
              <p
                className={`truncate font-semibold text-app-text ${isV2 ? "text-[15px]" : "text-sm"}`}
              >
                {token.name}
              </p>
              {badge}
              {token.paused && (
                // ui-v2-switch: sentence case, neutral chip.
                <Badge
                  variant="subtle"
                  tone={isV2 ? "neutral" : "yellow"}
                  uppercase={!isV2}
                  className="shrink-0"
                >
                  Paused
                </Badge>
              )}
            </div>

            {/* Line 2: concise date + (manual only) masked prefix reveal. */}
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <TokenLastUsedInfo token={token} />
              {!isMcp && (
                <>
                  <span aria-hidden="true" className="text-app-muted/40">
                    ·
                  </span>
                  <span
                    className={
                      isV2
                        ? "text-[13px] tabular-nums text-app-muted"
                        : "text-xs text-app-muted font-mono"
                    }
                  >
                    {revealed ? `${token.tokenPrefix}...` : "••••••••"}
                  </span>
                  {!isButtonVariant && (
                    <InlineIconButton
                      isV2={isV2}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRevealed((v) => !v);
                      }}
                      title={
                        revealed ? "Hide token prefix" : "Show token prefix"
                      }
                      icon={revealed ? faEyeSlash : faEye}
                    />
                  )}
                  {!isButtonVariant && showCopy && onCopy && (
                    <InlineIconButton
                      isV2={isV2}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(token.tokenPrefix);
                      }}
                      title="Copy prefix"
                      icon={faCopy}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {isButtonVariant && !showActions && (
          <div className="flex shrink-0 items-center pr-1">
            <FontAwesomeIcon
              icon={faArrowRight}
              className={`self-center text-xs text-app-muted/50 transition-colors ${isV2 ? "group-hover:text-app-text" : "group-hover:text-app-purple"}`}
            />
          </div>
        )}

        {showActions && (onEdit || onDelete || onPauseToggle) && (
          <TokenActionButtons
            token={token}
            onEdit={onEdit}
            onDelete={onDelete}
            onPauseToggle={onPauseToggle}
            revokingId={revokingId}
            pausingId={pausingId}
          />
        )}
      </div>

      <TokenWalletBadges token={token} walletsMap={walletsMap} />
    </Wrapper>
  );
};
