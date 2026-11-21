import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faTimes,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { PatFormView } from "../modals/pat/PatFormView";
import Button from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { AnimateBackground } from "./AnimateBackground";
import { useOAuthParams } from "./oauth/useOAuthParams";
import { useOAuthAuthorize } from "./oauth/useOAuthAuthorize";
import { OAuthErrorState } from "./oauth/OAuthErrorState";
import { useUiVersion } from "../hooks/useUiVersion";

const OAuthConsent = () => {
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch
  const params = useOAuthParams();
  const { clientId, redirectUri, scope, tokenName } = params;
  const {
    walletPerms,
    authorizing,
    hasReplayError,
    handleAuthorize,
    handleDeny,
    setPermission,
  } = useOAuthAuthorize(params);

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!params.valid) {
    return (
      <OAuthErrorState
        iconClassName={v2 ? "text-app-warn" : "text-app-yellow"}
        title="Invalid Request"
        message="Missing required OAuth parameters. Please try connecting again from your MCP client."
      />
    );
  }

  if (hasReplayError) {
    return (
      <OAuthErrorState
        iconClassName={v2 ? "text-app-danger" : "text-app-red"}
        title="Request Expired"
        message="This authorization request has expired or has already been used. Please start a new request from your client."
      >
        <Button variant="secondary" onClick={handleDeny}>
          Back to application
        </Button>
      </OAuthErrorState>
    );
  }

  const noWalletSelected = walletPerms.filter((w) => w.enabled).length === 0;
  const scopes = scope ? scope.split(" ").filter(Boolean) : [];

  if (v2)
    return (
      <div className="grid min-h-dvh place-items-center bg-app-bg px-4 py-10">
        <div className="flex w-full max-w-[480px] flex-col gap-6">
          <div className="flex w-full flex-col gap-6 rounded-[var(--r-card)] bg-app-card p-6 text-app-text shadow-[var(--box-ring)] sm:p-8">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text">
                Authorize access
              </h2>
              <p className="text-[13px] text-app-muted">
                An application is requesting access to your finance data
              </p>
            </div>

            {/* Client and requested access: one row each */}
            <div className="divide-y divide-app-border overflow-hidden rounded-[var(--r-input)] bg-app-raised">
              <div className="flex min-h-14 items-center justify-between gap-4 px-4">
                <span className="text-[13px] text-app-muted">Application</span>
                <span className="min-w-0 truncate text-sm font-semibold text-app-text">
                  {clientId}
                </span>
              </div>
              <div className="flex min-h-14 items-center justify-between gap-4 px-4">
                <span className="text-[13px] text-app-muted">Redirect</span>
                <span className="min-w-0 truncate text-[13px] text-app-text">
                  {redirectUri}
                </span>
              </div>
              {scopes.map((s) => (
                <div
                  key={s}
                  className="flex min-h-14 items-center justify-between gap-4 px-4"
                >
                  <span className="text-[13px] text-app-muted">Access</span>
                  <span className="text-sm font-semibold text-app-text">
                    {s}
                  </span>
                </div>
              ))}
            </div>

            {/* Wallet permissions (PatFormView is already v2) */}
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

            <div className="flex flex-col gap-3">
              <Button
                id="oauth-allow-btn"
                variant="primary"
                size="lg"
                fullWidth
                ripple
                onClick={handleAuthorize}
                disabled={authorizing || noWalletSelected}
              >
                {authorizing ? "Authorizing…" : "Approve"}
              </Button>
              <Button
                id="oauth-deny-btn"
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleDeny}
                disabled={authorizing}
              >
                Deny
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-app-muted">
            <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
            This will create a personal access token with the permissions you
            select. You can revoke it at any time from your API Tokens settings.
          </p>
        </div>
      </div>
    );

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
                    <Badge
                      key={s}
                      variant="subtle"
                      tone="purple"
                      shape="rounded"
                    >
                      {s}
                    </Badge>
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
