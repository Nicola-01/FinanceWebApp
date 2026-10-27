import { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import type { Wallet, PatToken } from "../../types/domain";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";
import { useSelection } from "../../hooks/useSelection";

/** Token list + wallet names + per-row and bulk (selection) actions. */
export function useTokens() {
  const [tokens, setTokens] = useState<PatToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);

  // Multi-select for bulk actions (long-press to select).
  const { selected, setSelected, toggleOne, clearSelection } = useSelection();
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkPausing, setBulkPausing] = useState(false);

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
    // Mount-only fetch (useSelection's setter is stable but opaque to the linter).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const toggleSelect = (token: PatToken) => toggleOne(token.id);

  const selectAll = (list: PatToken[]) =>
    setSelected(new Set(list.map((t) => t.id)));

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

  return {
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
  };
}
