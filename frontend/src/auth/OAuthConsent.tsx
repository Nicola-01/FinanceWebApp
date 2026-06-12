import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShieldAlt,
    faCheck,
    faTimes,
    faEye,
    faPen,
    faSpinner,
    faExclamationTriangle,
    faRobot,
    faKey,
    faArrowRight,
    faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { isTokenValid } from '../utils/authHelper';
import { triggerToast } from '../components/ToastNotification';
import { LoginBackground } from './LoginBackground';
import api from '../api/axiosConfig';
import axios from 'axios';
import type { Wallet } from '../utils/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatToken {
    id: string;
    name: string;
    tokenPrefix: string;
    walletPermissions: { walletId: string; permissions: string[] }[];
    createdAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

interface WalletPermState {
    walletId: string;
    walletName: string;
    walletIcon: string;
    walletColor: string;
    enabled: boolean;
    read: boolean;
    write: boolean;
}

type ConsentView = 'select' | 'create';

// ─── Component ───────────────────────────────────────────────────────────────

const OAuthConsent = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // OAuth params from URL
    const clientId = searchParams.get('client_id') || '';
    const redirectUri = searchParams.get('redirect_uri') || '';
    const scope = searchParams.get('scope') || '';
    const codeChallenge = searchParams.get('code_challenge') || '';
    const state = searchParams.get('state') || '';

    // UI state
    const [view, setView] = useState<ConsentView>('select');
    // const [loading, setLoading] = useState(false);
    const [authorizing, setAuthorizing] = useState(false);

    // Existing tokens
    const [tokens, setTokens] = useState<PatToken[]>([]);
    const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});
    const [loadingTokens, setLoadingTokens] = useState(true);

    // Create new token state
    const [tokenName, setTokenName] = useState('');
    const [walletPerms, setWalletPerms] = useState<WalletPermState[]>([]);
    const [creating, setCreating] = useState(false);

    // ─── Auth check ──────────────────────────────────────────────────────────

    useEffect(() => {
        if (!isTokenValid()) {
            // Redirect to login, preserving the full OAuth URL as return path
            const returnUrl = window.location.pathname + window.location.search;
            navigate('/login', { state: { from: { pathname: returnUrl } }, replace: true });
            return;
        }

        // Validate required OAuth params
        if (!clientId || !redirectUri || !codeChallenge || !state) {
            triggerToast('Invalid OAuth request — missing required parameters', false);
            return;
        }

        fetchTokens();
        fetchWalletsMap();
    }, []);

    // ─── Data fetching ───────────────────────────────────────────────────────

    const fetchTokens = async () => {
        setLoadingTokens(true);
        try {
            const res = await api.get('/tokens');
            setTokens(res.data);
        } catch {
            triggerToast('Failed to load tokens', false);
        } finally {
            setLoadingTokens(false);
        }
    };

    const fetchWalletsMap = async () => {
        try {
            const wRes = await api.get('/wallets');
            const fetched: Wallet[] = wRes.data;
            const map: Record<string, Wallet> = {};
            fetched.forEach(w => { map[w.id] = w; });
            setWalletsMap(map);
        } catch { /* silently ignore */ }
    };

    const fetchWalletsForCreate = async () => {
        try {
            const wRes = await api.get('/wallets');
            const fetchedWallets: Wallet[] = wRes.data;
            setWalletPerms(
                fetchedWallets.map(w => ({
                    walletId: w.id,
                    walletName: w.name,
                    walletIcon: w.icon,
                    walletColor: w.color,
                    enabled: false,
                    read: true,
                    write: false,
                }))
            );
        } catch {
            triggerToast('Failed to load wallets', false);
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
            const createRes = await api.post('/tokens', createPayload);
            const plainToken = createRes.data.plainToken;

            await completeAuthorization(plainToken);
        } catch (err: any) {
            triggerToast(err.response?.data?.detail || 'Authorization failed', false);
        } finally {
            setAuthorizing(false);
        }
    };

    /**
     * Create a new token and authorize with it.
     */
    const handleCreateAndAuthorize = async () => {
        if (!tokenName.trim()) {
            triggerToast('Please enter a token name', false);
            return;
        }

        const selectedWallets = walletPerms.filter(w => w.enabled);
        if (selectedWallets.length === 0) {
            triggerToast('Select at least one wallet', false);
            return;
        }

        setCreating(true);
        try {
            const payload = {
                name: tokenName.trim(),
                walletPermissions: selectedWallets.map(w => ({
                    walletId: w.walletId,
                    permissions: [
                        ...(w.read ? ['READ'] : []),
                        ...(w.write ? ['WRITE'] : []),
                    ],
                })),
            };

            const createRes = await api.post('/tokens', payload);
            const plainToken = createRes.data.plainToken;

            await completeAuthorization(plainToken);
        } catch (err: any) {
            triggerToast(err.response?.data?.detail || 'Failed to create token', false);
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
        const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
        const res = await axios.post(`${backendUrl}/oauth/authorize`, {
            plainToken,
            clientId,
            redirectUri,
            codeChallenge,
            state,
            scope,
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Redirect the browser to the MCP client
        window.location.href = res.data.redirectUrl;
    };

    /**
     * Deny the authorization request.
     */
    const handleDeny = () => {
        const separator = redirectUri.includes('?') ? '&' : '?';
        window.location.href = `${redirectUri}${separator}error=access_denied&state=${encodeURIComponent(state)}`;
    };

    // ─── Token creation helpers ──────────────────────────────────────────────

    const goToCreate = () => {
        setTokenName(`OAuth: ${clientId}`);
        setWalletPerms([]);
        fetchWalletsForCreate();
        setView('create');
    };

    const toggleWallet = (walletId: string) => {
        setWalletPerms(prev =>
            prev.map(w =>
                w.walletId === walletId
                    ? { ...w, enabled: !w.enabled, read: true, write: w.enabled ? false : w.write }
                    : w
            )
        );
    };

    const toggleWrite = (walletId: string) => {
        setWalletPerms(prev =>
            prev.map(w =>
                w.walletId === walletId && w.enabled
                    ? { ...w, write: !w.write }
                    : w
            )
        );
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    // Validate required params
    if (!clientId || !redirectUri || !codeChallenge || !state) {
        return (
            <div className="relative flex min-h-[100dvh] items-center justify-center bg-slate-900 px-4">
                <LoginBackground />
                <div className="relative z-10 w-full max-w-[480px] rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl text-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-amber-400 mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Invalid Request</h2>
                    <p className="text-sm text-white/60">
                        Missing required OAuth parameters. Please try connecting again from your MCP client.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-[100dvh] items-start pt-[6dvh] sm:items-center sm:pt-0 justify-center overflow-x-hidden overflow-y-auto bg-slate-900 px-4 sm:px-0 pb-8 sm:pb-0">
            <LoginBackground />

            <div className="relative z-10 w-full max-w-[520px] flex flex-col items-center gap-6">
                {/* ═══════════ Main Card ═══════════ */}
                <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-[modalFadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)]">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#4b1a69] to-[#4d6dff] shadow-[0_0_20px_rgba(77,109,255,0.4)]">
                            <FontAwesomeIcon icon={faShieldAlt} className="text-2xl text-white" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white text-center tracking-tight">
                            Authorize Access
                        </h2>
                        <p className="mt-2 text-sm text-white/50 text-center">
                            An application is requesting access to your finance data
                        </p>
                    </div>

                    {/* Client Info */}
                    <div className="mb-6 rounded-xl border border-white/5 bg-black/20 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#a78bfa]/15">
                                <FontAwesomeIcon icon={faRobot} className="text-[#a78bfa]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{clientId}</p>
                                <p className="text-[11px] text-white/40 truncate">{redirectUri}</p>
                            </div>
                        </div>
                        {scope && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {scope.split(' ').filter(Boolean).map(s => (
                                    <span key={s} className="inline-flex items-center rounded-md bg-[#a78bfa]/10 px-2 py-0.5 text-[10px] font-semibold text-[#a78bfa]">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ═══════════ SELECT VIEW ═══════════ */}
                    {view === 'select' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-white/40">
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

                            {loadingTokens && (
                                <div className="flex items-center justify-center py-10">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-[#a78bfa]" />
                                </div>
                            )}

                            {!loadingTokens && tokens.length === 0 && (
                                <div className="flex flex-col items-center py-8 text-center">
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                                        <FontAwesomeIcon icon={faKey} className="text-lg text-white/30" />
                                    </div>
                                    <p className="text-sm font-semibold text-white/40">No tokens yet</p>
                                    <p className="mt-1 text-xs text-white/25">Create a new token to authorize this client</p>
                                    <button
                                        onClick={goToCreate}
                                        className="mt-4 rounded-xl bg-[#a78bfa]/20 px-4 py-2 text-sm font-bold text-[#a78bfa] transition-all hover:bg-[#a78bfa]/30"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                        Create Token
                                    </button>
                                </div>
                            )}

                            {!loadingTokens && tokens.length > 0 && (
                                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                    {tokens.map(token => (
                                        <button
                                            key={token.id}
                                            onClick={() => handleSelectExistingToken(token)}
                                            disabled={authorizing}
                                            className="w-full group rounded-xl border border-white/5 bg-white/[0.03] p-3.5 text-left transition-all hover:border-[#a78bfa]/30 hover:bg-[#a78bfa]/5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#a78bfa]/10">
                                                        <FontAwesomeIcon icon={faKey} className="text-xs text-[#a78bfa]" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{token.name}</p>
                                                        <p className="text-[10px] font-mono text-white/30 truncate">{token.tokenPrefix}...</p>
                                                    </div>
                                                </div>
                                                <FontAwesomeIcon
                                                    icon={faArrowRight}
                                                    className="text-xs text-white/20 group-hover:text-[#a78bfa] transition-colors"
                                                />
                                            </div>

                                            {/* Wallet badges */}
                                            {token.walletPermissions && token.walletPermissions.length > 0 && (
                                                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-11">
                                                    {token.walletPermissions.map(wp => {
                                                        const wallet = walletsMap[wp.walletId];
                                                        return (
                                                            <span
                                                                key={wp.walletId}
                                                                className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-white/40"
                                                            >
                                                                {wallet?.icon && <span className="text-[10px]">{wallet.icon}</span>}
                                                                {wp.permissions.includes('WRITE') && (
                                                                    <FontAwesomeIcon icon={faPen} className="text-amber-400 text-[7px]" />
                                                                )}
                                                                {wp.permissions.includes('READ') && !wp.permissions.includes('WRITE') && (
                                                                    <FontAwesomeIcon icon={faEye} className="text-cyan-400 text-[7px]" />
                                                                )}
                                                                {wallet?.name || wp.walletId.substring(0, 8) + '...'}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════ CREATE VIEW ═══════════ */}
                    {view === 'create' && (
                        <div className="space-y-5">
                            {/* Back button */}
                            {tokens.length > 0 && (
                                <button
                                    onClick={() => setView('select')}
                                    className="text-xs font-semibold text-white/40 hover:text-white/60 transition-colors"
                                >
                                    ← Back to existing tokens
                                </button>
                            )}

                            {/* Token name */}
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-white/40">
                                    Token Name
                                </label>
                                <input
                                    id="oauth-token-name"
                                    type="text"
                                    value={tokenName}
                                    onChange={(e) => setTokenName(e.target.value)}
                                    placeholder="e.g., Claude AI Access"
                                    maxLength={50}
                                    className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-white/25 outline-none transition-all focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20"
                                />
                            </div>

                            {/* Wallet permissions */}
                            <div>
                                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-white/40">
                                    Wallet Permissions
                                </label>

                                {walletPerms.length === 0 ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#a78bfa]" />
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                        {walletPerms.map(wp => (
                                            <div
                                                key={wp.walletId}
                                                className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                                                    wp.enabled
                                                        ? 'border-[#a78bfa]/40 bg-[#a78bfa]/5'
                                                        : 'border-white/5 bg-white/[0.02] opacity-60 hover:opacity-80'
                                                }`}
                                                onClick={() => toggleWallet(wp.walletId)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                                                            style={{ backgroundColor: (wp.walletColor || '#6b7280') + '20' }}
                                                        >
                                                            {wp.walletIcon || '💰'}
                                                        </div>
                                                        <span className="text-sm font-semibold text-white">{wp.walletName}</span>
                                                    </div>

                                                    <div className={`h-5 w-9 rounded-full transition-all ${
                                                        wp.enabled ? 'bg-[#a78bfa]' : 'bg-white/10'
                                                    }`}>
                                                        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                                            wp.enabled ? 'translate-x-4' : 'translate-x-0'
                                                        }`} />
                                                    </div>
                                                </div>

                                                {wp.enabled && (
                                                    <div
                                                        className="mt-3 flex items-center gap-4 pl-12"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-400/15 px-2.5 py-1 text-[11px] font-bold text-cyan-400">
                                                            <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                                            Read
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleWrite(wp.walletId)}
                                                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                                wp.write
                                                                    ? 'bg-amber-400/15 text-amber-400'
                                                                    : 'bg-white/5 text-white/30 hover:text-white/50'
                                                            }`}
                                                        >
                                                            <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                            Write
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Create & Authorize button */}
                            <button
                                id="oauth-authorize-btn"
                                onClick={handleCreateAndAuthorize}
                                disabled={creating || !tokenName.trim() || walletPerms.filter(w => w.enabled).length === 0}
                                className="w-full rounded-xl bg-gradient-to-r from-[#4b1a69] to-[#4d6dff] py-3.5 text-sm font-bold text-white shadow-[0_5px_15px_rgba(77,109,255,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(77,109,255,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {creating ? (
                                    <><FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />Authorizing...</>
                                ) : (
                                    <><FontAwesomeIcon icon={faCheck} className="mr-2" />Create & Authorize</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* ═══════════ Authorization loading overlay ═══════════ */}
                    {authorizing && (
                        <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/5 p-4">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#a78bfa]" />
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
                        className="mt-4 w-full rounded-xl border border-white/5 bg-white/[0.03] py-3 text-sm font-semibold text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/60 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon icon={faTimes} className="mr-2" />
                        Deny Access
                    </button>
                </div>

                {/* Security notice */}
                <p className="text-center text-[11px] text-white/25 max-w-[400px]">
                    <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
                    This will create a personal access token with the permissions you select.
                    You can revoke it at any time from your API Tokens settings.
                </p>
            </div>
        </div>
    );
};

export default OAuthConsent;
