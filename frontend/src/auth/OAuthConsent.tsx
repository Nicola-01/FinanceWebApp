import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faTimes,
  faExclamationTriangle,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { isTokenValid } from "../utils/authHelper";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import type { Wallet, WalletPermState } from "../utils/types";
import { PatFormView } from "../modals/pat/PatFormView";
import Button from "../components/ui/Button";
import { AnimateBackground } from "./AnimateBackground";
import api from "../api/axiosConfig";
import axios from "axios";
import { getApiErrorDetail, isReplayError } from "../utils/apiError";

// ─── Component ───────────────────────────────────────────────────────────────

const OAuthConsent = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // OAuth params from URL
  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const scope = searchParams.get("scope") || "";
  const codeChallenge = searchParams.get("code_challenge") || "";
  const state = searchParams.get("state") || "";

  // Token is auto-named after the requesting client — the user never edits it.
  const tokenName = `OAuth: ${clientId}`;

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
    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
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

  // ─── Render ──────────────────────────────────────────────────────────────

  // Validate required params
  if (!clientId || !redirectUri || !codeChallenge || !state) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center px-4">
        <AnimateBackground />
        <div className="relative z-10 w-full max-w-[480px] rounded-[var(--r-card)] border border-app-border bg-app-surface/40 p-8 text-center shadow-2xl backdrop-blur-[20px]">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="mb-4 text-4xl text-app-yellow"
          />
          <h2 className="mb-2 text-xl font-bold text-app-text">
            Invalid Request
          </h2>
          <p className="text-sm text-app-muted">
            Missing required OAuth parameters. Please try connecting again from
            your MCP client.
          </p>
        </div>
      </div>
    );
  }

  if (hasReplayError) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center px-4">
        <AnimateBackground />
        <div className="relative z-10 w-full max-w-[480px] rounded-[var(--r-card)] border border-app-border bg-app-surface/40 p-8 text-center shadow-2xl backdrop-blur-[20px]">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="mb-4 text-4xl text-app-red"
          />
          <h2 className="mb-2 text-xl font-bold text-app-text">
            Request Expired
          </h2>
          <p className="mb-6 text-sm text-app-muted">
            This authorization request has expired or has already been used.
            Please start a new request from your client.
          </p>
          <Button variant="secondary" onClick={handleDeny}>
            Back to application
          </Button>
        </div>
      </div>
    );
  }

  const noWalletSelected = walletPerms.filter((w) => w.enabled).length === 0;

  return (
    <div className="relative flex min-h-[100dvh] items-start justify-center overflow-x-hidden overflow-y-auto px-4 pt-[6dvh] pb-8 sm:items-center sm:px-0 sm:pt-0 sm:pb-0">
      <AnimateBackground />
      <div className="relative z-10 flex w-full max-w-[520px] flex-col items-center gap-6">
        {/* ═══════════ Main Card ═══════════ */}
        <div className="w-full animate-[modalFadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)] rounded-[var(--r-card)] border border-app-border bg-app-surface/40 p-6 text-app-text shadow-2xl backdrop-blur-[20px] sm:p-8">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] shadow-[0_12px_26px_-14px_rgba(0,0,0,0.7)]">
              <FontAwesomeIcon
                icon={faShieldAlt}
                className="text-2xl text-white"
              />
            </div>
            <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
              Authorize Access
            </h2>
            <p className="mt-2 text-center text-sm text-app-muted">
              An application is requesting access to your finance data
            </p>
          </div>

          {/* Client Info */}
          <div className="mb-6 rounded-[var(--r-input)] border border-app-border bg-app-input p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-app-purple/15">
                <FontAwesomeIcon icon={faRobot} className="text-app-purple" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{clientId}</p>
                <p className="truncate text-[11px] text-app-muted">
                  {redirectUri}
                </p>
              </div>
            </div>
            {scope && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {scope
                  .split(" ")
                  .filter(Boolean)
                  .map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-md bg-app-purple/10 px-2 py-0.5 text-[10px] font-semibold text-app-purple"
                    >
                      {s}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* ═══════════ Wallet permissions ═══════════ */}
          <PatFormView
            isEdit={false}
            tokenName={tokenName}
            setTokenName={() => {}}
            walletPerms={walletPerms}
            setPermission={setPermission}
            onSubmit={handleAuthorize}
            isSubmitting={authorizing}
            hideName
            hideSubmit
          />

          {/* ═══════════ Actions ═══════════ */}
          <div className="mt-6 flex flex-col gap-3">
            <Button
              id="oauth-allow-btn"
              variant="primary"
              fullWidth
              ripple
              onClick={handleAuthorize}
              disabled={authorizing || noWalletSelected}
            >
              <FontAwesomeIcon icon={faShieldAlt} />
              {authorizing ? "Authorizing…" : "Allow Access"}
            </Button>
            <Button
              id="oauth-deny-btn"
              variant="secondary"
              fullWidth
              onClick={handleDeny}
              disabled={authorizing}
            >
              <FontAwesomeIcon icon={faTimes} />
              Deny Access
            </Button>
          </div>
        </div>

        {/* Security notice */}
        <p className="max-w-[400px] text-center text-[11px] text-app-muted/70">
          <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
          This will create a personal access token with the permissions you
          select. You can revoke it at any time from your API Tokens settings.
        </p>
      </div>
    </div>
  );
};

export default OAuthConsent;
