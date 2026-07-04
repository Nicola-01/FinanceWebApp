import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCheck,
  faShieldAlt,
  faPen,
  faPlug,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import type { Wallet, PatToken, WalletPermState } from "../../utils/types";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { ModalDialog } from "../../modals/common/ModalDialog";
import { PatFormView } from "../../modals/pat/PatFormView";
import { PatShowTokenView } from "../../modals/pat/PatShowTokenView";
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
    <span className="shrink-0 rounded-full bg-[#a78bfa]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#a78bfa]">
      MCP
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-app-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-app-muted">
      Manual
    </span>
  );

export const TokensSection: React.FC = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [tokens, setTokens] = useState<PatToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
      setTokens(res.data);
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
        <FontAwesomeIcon icon={faPen} className="theme-text-warning" /> Edit
        permissions
      </>
    ) : (
      <>
        <FontAwesomeIcon icon={faShieldAlt} className="theme-text-warning" />{" "}
        Token created
      </>
    );

  const dialogRightActions =
    view === "showToken"
      ? undefined
      : [
          {
            icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
            onClick: handleSubmit,
            hoverColor: "hover:text-app-green",
            disabled: isSubmitting,
          },
        ];

  return (
    <>
      <Card>
        {/* Toolbar: filter + create */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
          <Button size="sm" onClick={openCreate}>
            <FontAwesomeIcon icon={faPlus} />
            New token
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-border border-t-[#a78bfa]" />
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
                onDelete={(t) => handleRevoke(t.id)}
                revokingId={revokingId}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Create / edit / show-once dialog */}
      <ModalDialog
        ref={dialogRef}
        className="max-w-[560px]"
        title={dialogTitle}
        rightActions={dialogRightActions}
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
    </>
  );
};
