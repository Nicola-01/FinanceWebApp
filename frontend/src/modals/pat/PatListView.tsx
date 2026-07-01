import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { Wallet, PatToken } from "../../utils/types";
import { TokenListItem } from "../../components/pat/TokenListItem";

interface PatListViewProps {
  loadingTokens: boolean;
  tokens: PatToken[];
  walletsMap: Record<string, Wallet>;
  revokingId?: string | null;
  onRevoke?: (tokenId: string) => void;
  onCreate?: () => void;
  onEdit?: (token: PatToken) => void;
  onSelect?: (token: PatToken) => void;
  isSelectMode?: boolean;
  disabled?: boolean;
}

export const PatListView: React.FC<PatListViewProps> = ({
  loadingTokens,
  tokens,
  walletsMap,
  revokingId,
  onRevoke,
  onCreate,
  onEdit,
  onSelect,
  isSelectMode,
  disabled,
}) => {
  if (loadingTokens) {
    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-border border-t-[#a78bfa]" />
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-input">
            <FontAwesomeIcon icon={faKey} className="text-2xl text-app-muted" />
          </div>
          <p className="text-sm font-semibold text-app-muted">
            No API tokens yet
          </p>
          <p className="mt-1 text-xs text-app-muted/70">
            Create a token to access your data via MCP
          </p>
          <button
            onClick={onCreate}
            className="mt-4 rounded-xl bg-[#a78bfa]/20 px-4 py-2 text-sm font-bold text-[#a78bfa] transition-all hover:bg-[#a78bfa]/30"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Create Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {tokens.map((token) => (
        <TokenListItem
          key={token.id}
          token={token}
          walletsMap={walletsMap}
          onClick={isSelectMode && onSelect ? () => onSelect(token) : undefined}
          onDelete={
            !isSelectMode && onRevoke ? () => onRevoke(token.id) : undefined
          }
          onEdit={!isSelectMode && onEdit ? () => onEdit(token) : undefined}
          revokingId={revokingId}
          showActions={!isSelectMode}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
