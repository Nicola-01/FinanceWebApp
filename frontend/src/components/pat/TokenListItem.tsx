import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faArrowRight, faCopy } from "@fortawesome/free-solid-svg-icons";
import type { Wallet, PatToken } from "../../utils/types";
import { TokenActionButtons } from "./TokenActionButtons";
import { TokenWalletBadges } from "./TokenWalletBadges";
import { TokenLastUsedInfo } from "./TokenLastUsedInfo";

interface TokenListItemProps {
  token: PatToken;
  walletsMap: Record<string, Wallet>;
  onClick?: (token: PatToken) => void;
  onDelete?: (token: PatToken) => void;
  onEdit?: (token: PatToken) => void;
  disabled?: boolean;
  showActions?: boolean;
  showCopy?: boolean;
  onCopy?: (prefix: string) => void;
  revokingId?: string | null;
}

export const TokenListItem: React.FC<TokenListItemProps> = ({
  token,
  walletsMap,
  onClick,
  onDelete,
  onEdit,
  disabled,
  showActions = true,
  showCopy = false,
  onCopy,
  revokingId,
}) => {
  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? {
        onClick: () => onClick(token),
        disabled,
        type: "button" as const,
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`w-full group rounded-xl border p-3.5 text-left transition-all border-app-border bg-app-input hover:border-[#a78bfa]/50 disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-app-bg`}
          >
            <FontAwesomeIcon icon={faKey} className="text-lg text-app-muted" />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate text-app-text`}>
              {token.name}
            </p>
            <div className="flex items-center gap-2">
              <p className={`text-[11px] font-mono truncate text-app-muted`}>
                {token.tokenPrefix}...
              </p>
              {showCopy && onCopy && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(token.tokenPrefix);
                  }}
                  className="text-[10px] text-app-muted hover:text-app-text transition-colors"
                  title="Copy Prefix"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              )}
            </div>
          </div>
        </div>

        {onClick && !showActions && (
          <div className="shrink-0 flex items-center pr-1">
            <FontAwesomeIcon
              icon={faArrowRight}
              className={`text-xs text-app-muted/50 group-hover:text-[#a78bfa] transition-colors self-center`}
            />
          </div>
        )}

        {showActions && (onEdit || onDelete) && (
          <TokenActionButtons
            token={token}
            onEdit={onEdit}
            onDelete={onDelete}
            revokingId={revokingId}
          />
        )}
      </div>

      <TokenWalletBadges token={token} walletsMap={walletsMap} />

      <TokenLastUsedInfo token={token} />
    </Wrapper>
  );
};
