import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faTimes,
  faSpinner,
  faExclamationTriangle,
  faRobot,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { isTokenValid } from "../utils/authHelper";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import type { Wallet, PatToken, WalletPermState } from "../utils/types";
import { PatListView } from "../modals/pat/PatListView";
import { PatFormView } from "../modals/pat/PatFormView";
import { AnimateBackground } from "./AnimateBackground";
import api from "../api/axiosConfig";
import axios from "axios";
import { getApiErrorDetail, isReplayError } from "../utils/apiError";

type ConsentView = "select" | "create";

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

  // UI state
  const [view, setView] = useState<ConsentView>("select");
  // const [loading, setLoading] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  // Existing tokens
  const [tokens, setTokens] = useState<PatToken[]>([]);
  const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});
  const [loadingTokens, setLoadingTokens] = useState(true);

  // Create new token state
  const [tokenName, setTokenName] = useState("");
  const [walletPerms, setWalletPerms] = useState<WalletPermState[]>([]);
  const [creating, setCreating] = useState(false);

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

    fetchTokens();
    fetchWalletsMap();
    // Init one-shot al mount: valida i parametri OAuth (derivati dall'URL, stabili
    // per la vita della pagina) e carica token/wallet una sola volta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Data fetching ───────────────────────────────────────────────────────

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await api.get("/tokens");
      setTokens(res.data);
    } catch {
      triggerToast("Failed to load tokens", false);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchWalletsMap = async () => {
    try {
      const wRes = await api.get("/wallets");
      const fetched: Wallet[] = wRes.data;
      const map: Record<string, Wallet> = {};
      fetched.forEach((w) => {
        map[w.id] = w;
      });
      setWalletsMap(map);
    } catch {
      /* silently ignore */
    }
  };

  const fetchWalletsForCreate = async () => {
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
   * Authorize with an existing token — creates a fresh PAT with the same
   * permissions as the selected token, then initiates the OAuth flow.
   */
  const handleSelectExistingToken = async (token: PatToken) => {
    setAuthorizing(true);
    try {
      // Create a new PAT with the same wallet permissions as the selected token
      const createPayload = {
        name: `OAuth: ${clientId} (via ${token.name})`,
        walletPermissions: token.walletPermissions,
      };
      const createRes = await api.post("/tokens", createPayload);
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
   * Create a new token and authorize with it.
   */
  const handleCreateAndAuthorize = async () => {
    if (!tokenName.trim()) {
      triggerToast("Please enter a token name", false);
      return;
    }

    const selectedWallets = walletPerms.filter((w) => w.enabled);
    if (selectedWallets.length === 0) {
      triggerToast("Select at least one wallet", false);
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: tokenName.trim(),
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
        triggerToast(getApiErrorDetail(err, "Failed to create token"), false);
      }
    } finally {
      setCreating(false);
    }
  };

  /**
   * Complete the OAuth authorization by sending the plain token to the backend
   * and redirecting the browser to the MCP client's redirect_uri.
   */
  const completeAuthorization = async (plainToken: string) => {
    // Use raw axios — OAuth endpoints are NOT under /api/
    const backendUrl = import.meta.env.VITE_API_URL;
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

  // ─── Token creation helpers ──────────────────────────────────────────────

  const goToCreate = () => {
    setTokenName(`OAuth: ${clientId}`);
    setWalletPerms([]);
    fetchWalletsForCreate();
    setView("create");
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
        <div className="relative z-10 w-full max-w-[480px] rounded-[32px] border border-app-border bg-app-surface/40 p-8 shadow-2xl backdrop-blur-[20px] text-center">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="text-4xl theme-text-warning mb-4"
          />
          <h2 className="text-xl font-bold text-app-text mb-2">
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
        <div className="relative z-10 w-full max-w-[480px] rounded-[32px] border border-app-border bg-app-surface/40 p-8 shadow-2xl backdrop-blur-[20px] text-center">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="text-4xl theme-text-danger mb-4"
          />
          <h2 className="text-xl font-bold text-app-text mb-2">
            Richiesta Scaduta
          </h2>
          <p className="text-sm text-app-muted mb-6">
            Questa richiesta di autorizzazione è scaduta o è già stata
            utilizzata. Per favore, avvia una nuova richiesta dal client.
          </p>
          <button
            onClick={handleDeny}
            className="rounded-xl border border-app-border bg-app-input px-6 py-2.5 text-sm font-semibold text-app-text transition-all hover:border-[#a78bfa]/50"
          >
            Torna all'applicazione
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] items-start pt-[6dvh] sm:items-center sm:pt-0 justify-center overflow-x-hidden overflow-y-auto px-4 sm:px-0 pb-8 sm:pb-0">
      <AnimateBackground />
      <div className="relative z-10 w-full max-w-[520px] flex flex-col items-center gap-6">
        {/* ═══════════ Main Card ═══════════ */}
        <div className="w-full rounded-[32px] border border-app-border bg-app-surface/40 p-6 sm:p-8 text-app-text shadow-2xl backdrop-blur-[20px] animate-[modalFadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-app-purple to-app-blue shadow-[0_0_20px_rgba(77,109,255,0.4)]">
              <FontAwesomeIcon
                icon={faShieldAlt}
                className="text-2xl theme-text-default"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-center">
              Authorize Access
            </h2>
            <p className="mt-2 text-sm text-app-muted text-center">
              An application is requesting access to your finance data
            </p>
          </div>

          {/* Client Info */}
          <div className="mb-6 rounded-xl border border-app-border bg-app-input p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#a78bfa]/15">
                <FontAwesomeIcon icon={faRobot} className="text-[#a78bfa]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{clientId}</p>
                <p className="text-[11px] text-app-muted truncate">
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
                      className="inline-flex items-center rounded-md bg-[#a78bfa]/10 px-2 py-0.5 text-[10px] font-semibold text-[#a78bfa]"
                    >
                      {s}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* ═══════════ SELECT VIEW ═══════════ */}
          {view === "select" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-app-muted">
                  Select a Token
                </label>
                <button
                  onClick={goToCreate}
                  className="flex items-center gap-1.5 rounded-lg bg-[#a78bfa]/15 px-2.5 py-1 text-[11px] font-bold text-[#a78bfa] transition-all hover:bg-[#a78bfa]/25"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                  New Token
                </button>
              </div>

              <PatListView
                loadingTokens={loadingTokens}
                tokens={tokens}
                walletsMap={walletsMap}
                isSelectMode={true}
                onSelect={handleSelectExistingToken}
                onCreate={goToCreate}
                disabled={authorizing}
              />
            </div>
          )}

          {/* ═══════════ CREATE VIEW ═══════════ */}
          {view === "create" && (
            <div className="space-y-5">
              {/* Back button */}
              {tokens.length > 0 && (
                <button
                  onClick={() => setView("select")}
                  className="text-xs font-semibold text-app-muted hover:text-app-text transition-colors"
                >
                  ← Back to existing tokens
                </button>
              )}

              <PatFormView
                isEdit={false}
                tokenName={tokenName}
                setTokenName={setTokenName}
                walletPerms={walletPerms}
                setPermission={setPermission}
                onSubmit={handleCreateAndAuthorize}
                isSubmitting={creating}
                submitText="Create & Authorize"
                submittingText="Authorizing..."
                showDesktopButton={true}
              />
            </div>
          )}

          {/* ═══════════ Authorization loading overlay ═══════════ */}
          {authorizing && (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/5 p-4">
              <FontAwesomeIcon
                icon={faSpinner}
                className="animate-spin text-[#a78bfa]"
              />
              <span className="text-sm font-semibold text-[#a78bfa]">
                Authorizing...
              </span>
            </div>
          )}

          {/* ═══════════ Deny Button ═══════════ */}
          <button
            id="oauth-deny-btn"
            onClick={handleDeny}
            disabled={authorizing || creating}
            className="mt-4 w-full rounded-xl border border-app-border bg-app-input py-3 text-sm font-semibold text-app-muted transition-all hover:bg-app-bg hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Deny Access
          </button>
        </div>

        {/* Security notice */}
        <p className="text-center text-[11px] text-app-muted/70 max-w-[400px]">
          <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
          This will create a personal access token with the permissions you
          select. You can revoke it at any time from your API Tokens settings.
        </p>
      </div>
    </div>
  );
};

export default OAuthConsent;
