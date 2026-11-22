import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPlug,
  faTrash,
  faPause,
  faPlay,
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
import { McpConnectGuide } from "../tokens/McpConnectGuide";
import { useTokens } from "../tokens/useTokens";
import { useTokenDialog } from "../tokens/useTokenDialog";
import { useUiVersion } from "../../hooks/useUiVersion";
import { Skeleton } from "../../components/ui/Skeleton";

// ui-v2-switch: three placeholder rows shaped like TokenListItem (icon chip + two lines)
const TokenRowsSkeletonV2 = () => (
  <div
    aria-hidden="true"
    className="divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]"
  >
    {[0, 1, 2].map((i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-[11px]" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export const TokensSection: React.FC = () => {
  const deleteModalRef = useDeleteModal();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [ui] = useUiVersion();
  // ui-v2-switch: flat raised bars, no purple selection tint; Card's gap-4 spaces blocks.
  const isV2 = ui === "v2";

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
      <McpConnectGuide />

      <Card>
        <TokenFilterPills
          filters={FILTERS}
          filter={filter}
          onChange={setFilter}
        />

        {/* Bulk action bar: only while at least one row is long-press-selected. */}
        {selectionMode && (
          <div
            className={
              isV2
                ? "flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-input)] bg-app-raised px-3 py-2"
                : "mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-input)] border border-app-purple/30 bg-app-purple/5 px-3 py-2"
            }
          >
            <span className="text-sm font-semibold text-app-text">
              {selected.size} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {selected.size < filtered.length && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={selectAllFiltered}
                >
                  Select all ({filtered.length})
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkPause(true)}
                disabled={bulkPausing}
              >
                <FontAwesomeIcon icon={faPause} />
                Pause
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkPause(false)}
                disabled={bulkPausing}
              >
                <FontAwesomeIcon icon={faPlay} />
                Resume
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setBulkConfirm(true)}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          isV2 ? ( // ui-v2-switch
            <TokenRowsSkeletonV2 />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div
                className={`h-6 w-6 animate-spin rounded-full border-2 border-app-border ${isV2 ? "border-t-app-text" : "border-t-app-purple"}`}
              />
            </div>
          )
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${isV2 ? "bg-app-raised" : "bg-app-input"}`}
            >
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
          <div
            className={
              isV2
                ? "divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]"
                : "space-y-3"
            }
          >
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
          <div className={isV2 ? "" : "mt-4"}>
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
