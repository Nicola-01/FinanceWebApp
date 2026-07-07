import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "../ui/Badge";
import {
  faKey,
  faArrowRight,
  faCopy,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import type { Wallet, PatToken } from "../../utils/types";
import { TokenActionButtons } from "./TokenActionButtons";
import { TokenWalletBadges } from "./TokenWalletBadges";
import { TokenLastUsedInfo } from "./TokenLastUsedInfo";

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
  // --- legacy: keep working for the (dead-but-tested) PatListView onClick mode ---
  onClick?: (t: PatToken) => void;
  disabled?: boolean;
  showActions?: boolean;
  showCopy?: boolean;
  onCopy?: (prefix: string) => void;
}

/** Press-and-hold duration before a row enters selection mode. */
const LONG_PRESS_MS = 500;
/** Pointer travel (px) that cancels an in-progress long-press. */
const MOVE_TOLERANCE_PX = 8;

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

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const pressStart = useRef<{ x: number; y: number } | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    pressStart.current = null;
  }, []);

  useEffect(() => clearLongPress, [clearLongPress]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Presses that begin on an interactive control must not arm selection.
    if ((e.target as HTMLElement).closest("button")) return;
    longPressFired.current = false;
    pressStart.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onLongPressSelect?.(token);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pressStart.current) return;
    const dx = Math.abs(e.clientX - pressStart.current.x);
    const dy = Math.abs(e.clientY - pressStart.current.y);
    if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clearLongPress();
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Clicks bubbling up from the action/reveal/copy buttons are ignored here.
    if ((e.target as HTMLElement).closest("button")) return;
    if (longPressFired.current) {
      // Swallow the click synthesized right after a successful long-press.
      longPressFired.current = false;
      return;
    }
    if (selectionMode) onToggleSelect?.(token);
  };

  const Wrapper = isButtonVariant ? "button" : "div";
  const wrapperProps = isButtonVariant
    ? {
        onClick: () => onClick?.(token),
        disabled,
        type: "button" as const,
      }
    : {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: clearLongPress,
        onPointerLeave: clearLongPress,
        onPointerCancel: clearLongPress,
        onClick: handleRowClick,
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      };

  return (
    <Wrapper
      {...wrapperProps}
      className={`group w-full rounded-xl border p-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        !isButtonVariant ? "select-none" : ""
      } ${!isButtonVariant && selectionMode ? "cursor-pointer" : ""} ${
        selected
          ? "border-app-purple/60 bg-app-purple/5 ring-1 ring-app-purple/40"
          : "border-app-border bg-app-input hover:border-app-purple/50"
      } ${token.paused ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-app-bg">
            <FontAwesomeIcon icon={faKey} className="text-lg text-app-muted" />
          </div>
          <div className="min-w-0">
            {/* Line 1: token name + parent badge + paused pill. */}
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-app-text">
                {token.name}
              </p>
              {badge}
              {token.paused && (
                <Badge
                  variant="subtle"
                  tone="yellow"
                  uppercase
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
                  <span className="font-mono text-xs text-app-muted">
                    {revealed ? `${token.tokenPrefix}...` : "••••••••"}
                  </span>
                  {!isButtonVariant && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRevealed((v) => !v);
                      }}
                      className="text-xs text-app-muted transition-colors hover:text-app-text"
                      title={
                        revealed ? "Hide token prefix" : "Show token prefix"
                      }
                      aria-label={
                        revealed ? "Hide token prefix" : "Show token prefix"
                      }
                    >
                      <FontAwesomeIcon icon={revealed ? faEyeSlash : faEye} />
                    </button>
                  )}
                  {!isButtonVariant && showCopy && onCopy && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(token.tokenPrefix);
                      }}
                      className="text-xs text-app-muted transition-colors hover:text-app-text"
                      title="Copy prefix"
                      aria-label="Copy prefix"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </button>
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
              className="self-center text-xs text-app-muted/50 transition-colors group-hover:text-app-purple"
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
