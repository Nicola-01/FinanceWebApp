import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { Wallet, PatToken } from "../../utils/types";
import { TokenListItem } from "../../components/pat/TokenListItem";
import Button from "../../components/ui/Button";

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
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-border border-t-app-purple" />
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
          <Button
            variant="primary"
            size="sm"
            ripple
            onClick={onCreate}
            className="mt-4"
          >
            <FontAwesomeIcon icon={faPlus} />
            Create Token
          </Button>
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
