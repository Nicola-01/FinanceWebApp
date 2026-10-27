import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken, isTokenValid } from "../../utils/authHelper";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import type { Wallet, WalletPermState } from "../../types/domain";
import api from "../../api/axiosConfig";
import { getApiErrorDetail, isReplayError } from "../../utils/apiError";
import type { OAuthParams } from "./useOAuthParams";

/**
 * Consent-page flow: login/param/replay checks on mount, wallet permission
 * state, token creation + OAuth completion, and deny.
 */
export function useOAuthAuthorize(params: OAuthParams) {
  const { clientId, redirectUri, scope, codeChallenge, state, tokenName } =
    params;
  const navigate = useNavigate();

  // Wallet permissions the user grants to the new token
  const [walletPerms, setWalletPerms] = useState<WalletPermState[]>([]);
  const [authorizing, setAuthorizing] = useState(false);

  // Replay protection state
  const [hasReplayError, setHasReplayError] = useState(false);

  // ─── Auth check ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isTokenValid()) {
      // Redirect to login, preserving the full OAuth URL as return path
      const returnUrl = window.location.pathname + window.location.search;
      navigate("/login", {
        state: { from: { pathname: returnUrl } },
        replace: true,
      });
      return;
    }

    // Validate required OAuth params
    if (!clientId || !redirectUri || !codeChallenge || !state) {
      triggerToast(
        "Invalid OAuth request — missing required parameters",
        false,
      );
      return;
    }

    // Check if this authorization flow has already been processed
    if (sessionStorage.getItem(`oauth_used_state_${state}`)) {
      setHasReplayError(true);
      return;
    }

    fetchWallets();
    // One-shot init on mount: validate the OAuth params (derived from the URL,
    // stable for the page's lifetime) and load the wallets exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Data fetching ───────────────────────────────────────────────────────

  const fetchWallets = async () => {
    try {
      const wRes = await api.get("/wallets");
      const fetchedWallets: Wallet[] = wRes.data;
      setWalletPerms(
        fetchedWallets.map((w) => ({
          walletId: w.id,
          walletName: w.name,
          walletIcon: w.icon,
          walletColor: w.color,
          userRole: w.userRole,
          enabled: false,
          read: true,
          write: false,
        })),
      );
    } catch {
      triggerToast("Failed to load wallets", false);
    }
  };

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Create a new token scoped to the selected wallets and authorize with it.
   */
  const handleAuthorize = async () => {
    const selectedWallets = walletPerms.filter((w) => w.enabled);
    if (selectedWallets.length === 0) {
      triggerToast("Select at least one wallet", false);
      return;
    }

    setAuthorizing(true);
    try {
      const payload = {
        name: tokenName,
        walletPermissions: selectedWallets.map((w) => ({
          walletId: w.walletId,
          permissions: [
            ...(w.read ? ["READ"] : []),
            ...(w.write ? ["WRITE"] : []),
          ],
        })),
      };

      const createRes = await api.post("/tokens", payload);
      const plainToken = createRes.data.plainToken;

      await completeAuthorization(plainToken);
    } catch (err: unknown) {
      if (isReplayError(err)) {
        setHasReplayError(true);
      } else {
        triggerToast(getApiErrorDetail(err, "Authorization failed"), false);
      }
    } finally {
      setAuthorizing(false);
    }
  };

  /**
   * Complete the OAuth authorization by sending the plain token to the backend
   * and redirecting the browser to the MCP client's redirect_uri.
   */
  const completeAuthorization = async (plainToken: string) => {
    // Use raw axios — OAuth endpoints are NOT under /api/
    const backendUrl = window.__ENV__?.apiUrl ?? import.meta.env.VITE_API_URL;
    const token = getToken();
    try {
      const res = await axios.post(
        `${backendUrl}/oauth/authorize`,
        {
          plainToken,
          clientId,
          redirectUri,
          codeChallenge,
          state,
          scope,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Mark this flow as consumed in the frontend session
      sessionStorage.setItem(`oauth_used_state_${state}`, "true");

      // Redirect the browser to the MCP client
      window.location.href = res.data.redirectUrl;
    } catch (err: unknown) {
      if (isReplayError(err)) {
        setHasReplayError(true);
      } else {
        throw err;
      }
    }
  };

  /**
   * Deny the authorization request.
   */
  const handleDeny = () => {
    const separator = redirectUri.includes("?") ? "&" : "?";
    window.location.href = `${redirectUri}${separator}error=access_denied&state=${encodeURIComponent(state)}`;
  };

  const setPermission = (
    walletId: string,
    level: "none" | "read" | "write",
  ) => {
    setWalletPerms((prev) =>
      prev.map((wp) => {
        if (wp.walletId !== walletId) return wp;
        if (level === "none")
          return { ...wp, enabled: false, read: false, write: false };
        if (level === "read")
          return { ...wp, enabled: true, read: true, write: false };
        return { ...wp, enabled: true, read: true, write: true };
      }),
    );
  };

  return {
    walletPerms,
    authorizing,
    hasReplayError,
    handleAuthorize,
    handleDeny,
    setPermission,
  };
}
