import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Wallet } from "../types/domain";
import { walletSlug } from "../utils/walletSlug";

/**
 * Resolves the URL slug (`name-<last5uuid>`) to a wallet in the list.
 * 1) exact id match -> backward compatibility with old full-UUID links.
 * 2) suffix match -> last slug segment == last 5 chars of the id.
 */
export const resolveWalletParam = (
  wallets: Wallet[],
  param: string | undefined,
): Wallet | null => {
  if (!param) return null;
  const exact = wallets.find((w) => w.id === param);
  if (exact) return exact;
  const suffix = param.split("-").pop();
  return wallets.find((w) => w.id.slice(-5) === suffix) || null;
};

/**
 * Resolves `walletId` (URL param) to the selected wallet and keeps the URL
 * canonical once the list is loaded.
 */
export function useWalletRouting(
  wallets: Wallet[],
  loading: boolean,
  walletId: string | undefined,
): Wallet | null {
  const navigate = useNavigate();

  // Handles two cases when walletId/list changes:
  // - the resolved wallet's slug differs from the param (old UUID or renamed)
  //   -> rewrite the URL in canonical form (replace).
  // - the param resolves no wallet (e.g. deleted) -> navigate to the first one.
  useEffect(() => {
    if (loading || wallets.length === 0 || !walletId) return;
    const current = resolveWalletParam(wallets, walletId);
    if (current) {
      const canonical = walletSlug(current);
      if (walletId !== canonical)
        navigate(`/dashboard/${canonical}`, { replace: true });
    } else {
      navigate(`/dashboard/${walletSlug(wallets[0])}`, { replace: true });
    }
  }, [walletId, wallets, loading, navigate]);

  return resolveWalletParam(wallets, walletId);
}
