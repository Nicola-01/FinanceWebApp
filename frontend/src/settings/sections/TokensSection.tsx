import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPlug,
  faTrash,
  faPause,
  faPlay,
  faHandPointer,
} from "@fortawesome/free-solid-svg-icons";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { ConfirmModal } from "../../modals/common/ConfirmModal";
import { useDeleteModal } from "../../modals/common/DeleteModalContext";
import { TokenListItem } from "../../components/pat/TokenListItem";
import {
  filterTokens,
  isMcpToken,
  type FilterKey,
} from "../tokens/tokenHelpers";
import { TokenTypeBadge } from "../tokens/TokenTypeBadge";
import { TokenFilterPills } from "../tokens/TokenFilterPills";
import { TokenDialog } from "../tokens/TokenDialog";
import { useTokens } from "../tokens/useTokens";
import { useTokenDialog } from "../tokens/useTokenDialog";

export const TokensSection: React.FC = () => {
  const deleteModalRef = useDeleteModal();
  const [filter, setFilter] = useState<FilterKey>("all");

  const {
    tokens,
    loading,
    walletsMap,
    revokingId,
    pausingId,
    selected,
    clearSelection,
    bulkConfirm,
    setBulkConfirm,
    bulkDeleting,
    bulkPausing,
    fetchTokens,
    handleRevoke,
    handlePauseToggle,
    toggleSelect,
    selectAll,
    handleBulkDelete,
    handleBulkPause,
  } = useTokens();
  const dialog = useTokenDialog(fetchTokens);
  const { openCreate, openEdit } = dialog;

  // ─── Derived ──────────────────────────────────────────────────────────────

  const selectionMode = selected.size > 0;

  const mcpCount = tokens.filter(isMcpToken).length;
  const manualCount = tokens.length - mcpCount;
  const filtered = filterTokens(tokens, filter);

  const selectAllFiltered = () => selectAll(filtered);

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: tokens.length },
    { key: "manual", label: "Manual", count: manualCount },
    { key: "mcp", label: "MCP", count: mcpCount },
  ];

  return (
    <>
      <Card>
        <TokenFilterPills
          filters={FILTERS}
          filter={filter}
          onChange={setFilter}
        />

        {/* Bulk action bar — always visible while there are tokens; actions
            stay disabled until at least one row is long-press-selected. */}
        {tokens.length > 0 && (
          <div
            className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-input)] border px-3 py-2 ${
              selectionMode
                ? "border-app-purple/30 bg-app-purple/5"
                : "border-app-border bg-app-input"
            }`}
          >
            {selectionMode ? (
              <span className="text-sm font-semibold text-app-text">
                {selected.size} selected
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm text-app-muted">
                <FontAwesomeIcon icon={faHandPointer} className="text-xs" />
                Hold a token to select
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {selectionMode && selected.size < filtered.length && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={selectAllFiltered}
                >
                  Select all ({filtered.length})
                </Button>
              )}
              {selectionMode && (
                <Button variant="secondary" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkPause(true)}
                disabled={!selectionMode || bulkPausing}
              >
                <FontAwesomeIcon icon={faPause} />
                Pause
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkPause(false)}
                disabled={!selectionMode || bulkPausing}
              >
                <FontAwesomeIcon icon={faPlay} />
                Resume
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setBulkConfirm(true)}
                disabled={!selectionMode}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-border border-t-app-purple" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-input">
              <FontAwesomeIcon
                icon={faPlug}
                className="text-2xl text-app-muted"
              />
            </div>
            <p className="text-sm font-semibold text-app-muted">
              No tokens yet
            </p>
            <p className="mt-1 text-xs text-app-muted/70">
              Create a token for API access, or connect an MCP client.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-app-muted">
            No {filter} tokens.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((token) => (
              <TokenListItem
                key={token.id}
                token={token}
                walletsMap={walletsMap}
                badge={<TokenTypeBadge mcp={isMcpToken(token)} />}
                onEdit={openEdit}
                onDelete={(t) =>
                  deleteModalRef.current?.deleteObject(
                    t,
                    "token",
                    async () => {
                      await handleRevoke(t.id);
                    },
                    1,
                  )
                }
                onPauseToggle={handlePauseToggle}
                revokingId={revokingId}
                pausingId={pausingId}
                selectionMode={selectionMode}
                selected={selected.has(token.id)}
                onLongPressSelect={toggleSelect}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {/* Primary create action lives at the bottom, always available. */}
        {!loading && (
          <div className="mt-4">
            <Button variant="primary" fullWidth ripple onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} />
              New token
            </Button>
          </div>
        )}
      </Card>

      <TokenDialog dialog={dialog} />

      {/* Bulk-delete confirmation */}
      <ConfirmModal
        open={bulkConfirm}
        tone="danger"
        title={`Delete ${selected.size} ${
          selected.size === 1 ? "token" : "tokens"
        }?`}
        message="Any app or MCP client using these tokens will immediately lose access. This can't be undone."
        confirmLabel={`Delete ${selected.size} ${
          selected.size === 1 ? "token" : "tokens"
        }`}
        busy={bulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
    </>
  );
};
