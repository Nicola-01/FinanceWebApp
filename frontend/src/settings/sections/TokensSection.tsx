import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faShieldAlt,
  faPen,
  faPlug,
  faTrash,
  faPause,
  faPlay,
  faHandPointer,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import type { Wallet, PatToken, WalletPermState } from "../../utils/types";
import { Card } from "../../components/ui/Card";
import { Badge as UiBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { ModalDialog } from "../../modals/common/ModalDialog";
import { PatFormView } from "../../modals/pat/PatFormView";
import { PatShowTokenView } from "../../modals/pat/PatShowTokenView";
import { ConfirmModal } from "../../modals/common/ConfirmModal";
import { useDeleteModal } from "../../modals/common/DeleteModalContext";
import { TokenListItem } from "../../components/pat/TokenListItem";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";

type DialogView = "create" | "edit" | "showToken";
type FilterKey = "all" | "manual" | "mcp";

// An OAuth/MCP-issued token is just a PAT whose name the consent flow prefixes
// with "OAuth:". Until the backend stores a real `source`/`clientName`, this
// name heuristic is the only signal distinguishing MCP connections from manual
// tokens.
const isMcpToken = (t: PatToken) =>
  t.name.trim().toLowerCase().startsWith("oauth:");

const Badge: React.FC<{ mcp: boolean }> = ({ mcp }) =>
  mcp ? (
    <UiBadge variant="subtle" tone="purple" uppercase className="shrink-0">
      MCP
    </UiBadge>
  ) : (
    <UiBadge variant="subtle" tone="neutral" uppercase className="shrink-0">
      Manual
    </UiBadge>
  );

export const TokensSection: React.FC = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useDeleteModal();

  const [tokens, setTokens] = useState<PatToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);

  // Multi-select for bulk actions (long-press to select).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkPausing, setBulkPausing] = useState(false);

  // Dialog (create / edit / show-once) state.
  const [view, setView] = useState<DialogView>("create");
  const [tokenIdToEdit, setTokenIdToEdit] = useState<string | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [walletPerms, setWalletPerms] = useState<WalletPermState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState("");
  const [copied, setCopied] = useState(false);

  // ─── Data ─────────────────────────────────────────────────────────────────

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tokens");
      const list: PatToken[] = res.data;
      setTokens(list);
      // Drop any selected ids that no longer exist.
      setSelected(
        (prev) =>
          new Set([...prev].filter((id) => list.some((t) => t.id === id))),
      );
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to load tokens"), false);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletsMap = async () => {
    try {
      const wRes = await api.get("/wallets");
      const fetched: Wallet[] = wRes.data;
      const map: Record<string, Wallet> = {};
      fetched.forEach((w) => (map[w.id] = w));
      setWalletsMap(map);
    } catch {
      /* silently ignore — names just fall back to ids */
    }
  };

  useEffect(() => {
    fetchTokens();
    fetchWalletsMap();
  }, []);

  const prepareWalletsForForm = async (existing?: PatToken) => {
    try {
      const wRes = await api.get("/wallets");
      const fetched: Wallet[] = wRes.data;
      setWalletPerms(
        fetched.map((w) => {
          const perm = existing?.walletPermissions.find(
            (wp) => wp.walletId === w.id,
          );
          return {
            walletId: w.id,
            walletName: w.name,
            walletIcon: w.icon,
            walletColor: w.color,
            userRole: w.userRole,
            enabled: !!perm,
            read: true,
            write: perm ? perm.permissions.includes("WRITE") : false,
          };
        }),
      );
    } catch {
      triggerToast("Failed to load wallets", false);
    }
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setTokenIdToEdit(null);
    setTokenName("");
    setWalletPerms([]);
    setGeneratedToken("");
    setCopied(false);
    setView("create");
    prepareWalletsForForm();
    dialogRef.current?.showModal();
  };

  const openEdit = (token: PatToken) => {
    setTokenIdToEdit(token.id);
    setTokenName(token.name);
    setWalletPerms([]);
    setView("edit");
    prepareWalletsForForm(token);
    dialogRef.current?.showModal();
  };

  const setPermission = (
    walletId: string,
    level: "none" | "read" | "write",
  ) => {
    setWalletPerms((prev) =>
      prev.map((w) =>
        w.walletId === walletId
          ? {
              ...w,
              enabled: level !== "none",
              read: level !== "none",
              write: level === "write",
            }
          : w,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!tokenName.trim()) {
      triggerToast("Please enter a token name", false);
      return;
    }
    const selected = walletPerms.filter((w) => w.enabled);
    if (selected.length === 0) {
      triggerToast("Select at least one wallet", false);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: tokenName.trim(),
        walletPermissions: selected.map((w) => ({
          walletId: w.walletId,
          permissions: [
            ...(w.read ? ["READ"] : []),
            ...(w.write ? ["WRITE"] : []),
          ],
        })),
      };
      if (view === "edit" && tokenIdToEdit) {
        await api.put(`/tokens/${tokenIdToEdit}`, payload);
        triggerToast("Token permissions updated!", true);
        dialogRef.current?.close();
        fetchTokens();
      } else {
        const res = await api.post("/tokens", payload);
        setGeneratedToken(res.data.plainToken);
        setCopied(false);
        setView("showToken");
        triggerToast("Token created successfully!", true);
      }
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to save token"), false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    setRevokingId(tokenId);
    try {
      await api.delete(`/tokens/${tokenId}`);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
      triggerToast("Access revoked", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to revoke token"), false);
    } finally {
      setRevokingId(null);
    }
  };

  const handlePauseToggle = async (token: PatToken) => {
    setPausingId(token.id);
    const action = token.paused ? "resume" : "pause";
    try {
      const res = await api.post(`/tokens/${token.id}/${action}`);
      const updated: PatToken = res.data;
      setTokens((prev) => prev.map((t) => (t.id === token.id ? updated : t)));
      triggerToast(updated.paused ? "Token paused" : "Token resumed", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to update token"), false);
    } finally {
      setPausingId(null);
    }
  };

  const toggleSelect = (token: PatToken) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(token.id)) next.delete(token.id);
      else next.add(token.id);
      return next;
    });
  };

  const selectAllFiltered = () =>
    setSelected(new Set(filtered.map((t) => t.id)));

  const clearSelection = () => setSelected(new Set());

  const handleBulkDelete = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      await api.post("/tokens/bulk-delete", { ids });
      setTokens((prev) => prev.filter((t) => !selected.has(t.id)));
      triggerToast(
        ids.length === 1 ? "Token deleted" : `${ids.length} tokens deleted`,
        true,
      );
      clearSelection();
      setBulkConfirm(false);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to delete tokens"), false);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkPause = async (paused: boolean) => {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkPausing(true);
    try {
      const res = await api.post("/tokens/bulk-pause", { ids, paused });
      const map = new Map((res.data as PatToken[]).map((t) => [t.id, t]));
      setTokens((prev) => prev.map((t) => map.get(t.id) ?? t));
      // Keep the selection so the user can chain another bulk action.
      triggerToast(
        `${ids.length} ${ids.length === 1 ? "token" : "tokens"} ${
          paused ? "paused" : "resumed"
        }`,
        true,
      );
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to update tokens"), false);
    } finally {
      setBulkPausing(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      triggerToast("Token copied to clipboard!", true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      triggerToast("Failed to copy", false);
    }
  };

  const handleCloseClick = () => {
    dialogRef.current?.close();
    if (view === "showToken") fetchTokens();
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const selectionMode = selected.size > 0;

  const mcpCount = tokens.filter(isMcpToken).length;
  const manualCount = tokens.length - mcpCount;
  const filtered = tokens.filter((t) =>
    filter === "all" ? true : filter === "mcp" ? isMcpToken(t) : !isMcpToken(t),
  );

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: tokens.length },
    { key: "manual", label: "Manual", count: manualCount },
    { key: "mcp", label: "MCP", count: mcpCount },
  ];

  const dialogTitle =
    view === "create" ? (
      <>
        <FontAwesomeIcon icon={faPlus} className="text-app-green" /> New token
      </>
    ) : view === "edit" ? (
      <>
        <FontAwesomeIcon icon={faPen} className="text-app-yellow" /> Edit
        permissions
      </>
    ) : (
      <>
        <FontAwesomeIcon icon={faShieldAlt} className="text-app-yellow" /> Token
        created
      </>
    );

  const submitDisabled =
    isSubmitting ||
    !tokenName.trim() ||
    walletPerms.filter((w) => w.enabled).length === 0;

  const dialogFooter =
    view === "create" || view === "edit" ? (
      <Button
        variant="primary"
        fullWidth
        ripple
        onClick={handleSubmit}
        disabled={submitDisabled}
      >
        {isSubmitting
          ? view === "edit"
            ? "Saving…"
            : "Generating…"
          : view === "edit"
            ? "Save changes"
            : "Generate token"}
      </Button>
    ) : undefined;

  return (
    <>
      <Card>
        {/* Toolbar: filter pills */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-[var(--r-input)] border border-app-border bg-app-input p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-[var(--r-sm)] px-3 py-1.5 text-xs font-bold transition-colors ${
                  filter === f.key
                    ? "bg-app-surface text-app-text"
                    : "text-app-muted hover:text-app-text"
                }`}
              >
                {f.label}
                <span className="ml-1.5 text-app-muted">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

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
                badge={<Badge mcp={isMcpToken(token)} />}
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

      {/* Create / edit / show-once dialog */}
      <ModalDialog
        ref={dialogRef}
        className="max-w-[560px]"
        title={dialogTitle}
        footer={dialogFooter}
        onCloseClick={handleCloseClick}
        showClose={true}
      >
        {(view === "create" || view === "edit") && (
          <PatFormView
            isEdit={view === "edit"}
            tokenName={tokenName}
            setTokenName={setTokenName}
            walletPerms={walletPerms}
            setPermission={setPermission}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            hideSubmit
          />
        )}
        {view === "showToken" && (
          <PatShowTokenView
            generatedToken={generatedToken}
            copied={copied}
            onCopy={handleCopy}
            onDone={handleCloseClick}
          />
        )}
      </ModalDialog>

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
