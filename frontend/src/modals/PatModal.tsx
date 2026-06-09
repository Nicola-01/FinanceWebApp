import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCode,
    faPlus,
    faCopy,
    faCheck,
    faTrashAlt,
    faKey,
    faExclamationTriangle,
    faShieldAlt,
    faEye,
    faPen,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { triggerToast } from '../components/ToastNotification';
import api from '../api/axiosConfig';
import type { Wallet } from '../utils/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WalletPermissionDto {
    walletId: string;
    permissions: string[];
}

interface PatToken {
    id: string;
    name: string;
    tokenPrefix: string;
    walletPermissions: WalletPermissionDto[];
    createdAt: string;
    expiresAt: string | null;
    lastUsedAt: string | null;
}

// Per-wallet permission state used during creation
interface WalletPermState {
    walletId: string;
    walletName: string;
    walletIcon: string;
    walletColor: string;
    enabled: boolean;
    read: boolean;
    write: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface PatModalHandle {
    openModal: () => void;
}

type ModalView = 'list' | 'create' | 'showToken';

export const PatModal = forwardRef<PatModalHandle>((_props, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Navigation state
    const [view, setView] = useState<ModalView>('list');

    // List view
    const [tokens, setTokens] = useState<PatToken[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(false);

    // Create view
    const [tokenName, setTokenName] = useState('');
    const [walletPerms, setWalletPerms] = useState<WalletPermState[]>([]);
    const [creating, setCreating] = useState(false);

    // Show-once view
    const [generatedToken, setGeneratedToken] = useState('');
    const [copied, setCopied] = useState(false);

    // Revocation loading state
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Wallet lookup map (id → Wallet) for resolving names in the list view
    const [walletsMap, setWalletsMap] = useState<Record<string, Wallet>>({});

    // ─── Imperative handle ────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
        openModal: () => {
            setView('list');
            setGeneratedToken('');
            setCopied(false);
            dialogRef.current?.showModal();
            fetchTokens();
            fetchWalletsMap();
        }
    }));

    // ─── Data fetching ────────────────────────────────────────────────────────

    const fetchTokens = async () => {
        setLoadingTokens(true);
        try {
            const res = await api.get('/tokens');
            setTokens(res.data);
        } catch (err: any) {
            triggerToast(err.response?.data?.detail || 'Failed to load tokens', false);
        } finally {
            setLoadingTokens(false);
        }
    };

    /** Fetches wallets once and builds an id→Wallet lookup map for resolving names */
    const fetchWalletsMap = async () => {
        try {
            const wRes = await api.get('/wallets');
            const fetched: Wallet[] = wRes.data;
            const map: Record<string, Wallet> = {};
            fetched.forEach(w => { map[w.id] = w; });
            setWalletsMap(map);
        } catch { /* silently ignore — badges will fallback to truncated IDs */ }
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
                    write: false
                }))
            );
        } catch (err: any) {
            triggerToast('Failed to load wallets', false);
        }
    };

    // ─── Actions ──────────────────────────────────────────────────────────────

    const handleCreate = async () => {
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
                        ...(w.write ? ['WRITE'] : [])
                    ]
                }))
            };

            const res = await api.post('/tokens', payload);
            setGeneratedToken(res.data.plainToken);
            setCopied(false);
            setView('showToken');
            triggerToast('Token created successfully!', true);
        } catch (err: any) {
            triggerToast(err.response?.data?.detail || 'Failed to create token', false);
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (tokenId: string) => {
        setRevokingId(tokenId);
        try {
            await api.delete(`/tokens/${tokenId}`);
            setTokens(prev => prev.filter(t => t.id !== tokenId));
            triggerToast('Token revoked', true);
        } catch (err: any) {
            triggerToast(err.response?.data?.detail || 'Failed to revoke token', false);
        } finally {
            setRevokingId(null);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generatedToken);
            setCopied(true);
            triggerToast('Token copied to clipboard!', true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            triggerToast('Failed to copy', false);
        }
    };

    const goToCreate = () => {
        setTokenName('');
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

    // ─── Date formatting helper ───────────────────────────────────────────────

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const renderTitle = () => {
        if (view === 'list') return <><FontAwesomeIcon icon={faCode} className="text-[#a78bfa]" /> API Tokens</>;
        if (view === 'create') return <><FontAwesomeIcon icon={faPlus} className="text-[#00ff7f]" /> New Token</>;
        return <><FontAwesomeIcon icon={faShieldAlt} className="text-amber-400" /> Token Created</>;
    };

    const renderRightActions = () => {
        if (view === 'list') {
            return [{
                icon: <FontAwesomeIcon icon={faPlus} className="text-xl" />,
                onClick: goToCreate,
                hoverColor: 'hover:text-[#00ff7f]'
            }];
        }
        if (view === 'create') {
            return [{
                icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
                onClick: handleCreate,
                hoverColor: 'hover:text-[#00ff7f]',
                disabled: creating
            }];
        }
        return undefined;
    };

    const handleCloseClick = () => {
        if (view === 'create') {
            setView('list');
        } else if (view === 'showToken') {
            setView('list');
            fetchTokens();
        } else {
            dialogRef.current?.close();
        }
    };

    return (
        <ModalDialog
            ref={dialogRef}
            className="max-w-[560px]"
            title={renderTitle()}
            rightActions={renderRightActions()}
            onCloseClick={handleCloseClick}
            showClose={true}
        >
            {/* ══════════════ LIST VIEW ══════════════ */}
            {view === 'list' && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {loadingTokens && (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-border border-t-[#a78bfa]" />
                        </div>
                    )}

                    {!loadingTokens && tokens.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-input">
                                <FontAwesomeIcon icon={faKey} className="text-2xl text-app-muted" />
                            </div>
                            <p className="text-sm font-semibold text-app-muted">No API tokens yet</p>
                            <p className="mt-1 text-xs text-app-muted/70">
                                Create a token to access your data via MCP
                            </p>
                            <button
                                onClick={goToCreate}
                                className="mt-4 rounded-xl bg-[#a78bfa]/20 px-4 py-2 text-sm font-bold text-[#a78bfa] transition-all hover:bg-[#a78bfa]/30"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Create Token
                            </button>
                        </div>
                    )}

                    {!loadingTokens && tokens.map(token => (
                        <div
                            key={token.id}
                            className="group rounded-xl border border-app-border bg-app-input/40 p-4 transition-all hover:border-app-border/80"
                        >
                            {/* Token header */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#a78bfa]/15">
                                        <FontAwesomeIcon icon={faKey} className="text-sm text-[#a78bfa]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-app-text truncate">{token.name}</p>
                                        <p className="text-[11px] font-mono text-app-muted truncate">
                                            {token.tokenPrefix}...
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRevoke(token.id)}
                                    disabled={revokingId === token.id}
                                    className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-app-muted/50 transition-all hover:bg-[#ff4d4d]/15 hover:text-[#ff4d4d] disabled:opacity-40"
                                    title="Revoke token"
                                >
                                    <FontAwesomeIcon
                                        icon={faTrashAlt}
                                        className={`text-xs ${revokingId === token.id ? 'animate-pulse' : ''}`}
                                    />
                                </button>
                            </div>

                            {/* Token metadata */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-app-muted">
                                <span>
                                    <FontAwesomeIcon icon={faClock} className="mr-1 opacity-50" />
                                    Created {formatDate(token.createdAt)}
                                </span>
                                {token.lastUsedAt && (
                                    <span>
                                        Last used {formatDate(token.lastUsedAt)}
                                    </span>
                                )}
                                {token.expiresAt && (
                                    <span className={new Date(token.expiresAt) < new Date() ? 'text-[#ff4d4d]' : ''}>
                                        {new Date(token.expiresAt) < new Date() ? 'Expired' : `Expires ${formatDate(token.expiresAt)}`}
                                    </span>
                                )}
                            </div>

                            {/* Wallet permission badges */}
                            {token.walletPermissions && token.walletPermissions.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {token.walletPermissions.map(wp => {
                                        const wallet = walletsMap[wp.walletId];
                                        return (
                                            <span
                                                key={wp.walletId}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-app-bg/60 px-2 py-0.5 text-[10px] font-semibold text-app-muted"
                                            >
                                                {wallet?.icon && <span className="text-[10px]">{wallet.icon}</span>}
                                                {wp.permissions.includes('WRITE') && (
                                                    <FontAwesomeIcon icon={faPen} className="text-amber-400 text-[8px]" />
                                                )}
                                                {wp.permissions.includes('READ') && !wp.permissions.includes('WRITE') && (
                                                    <FontAwesomeIcon icon={faEye} className="text-cyan-400 text-[8px]" />
                                                )}
                                                {wallet?.name || wp.walletId.substring(0, 8) + '...'}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════ CREATE VIEW ══════════════ */}
            {view === 'create' && (
                <div className="space-y-5">
                    {/* Token name */}
                    <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
                            Token Name
                        </label>
                        <input
                            id="pat-token-name"
                            type="text"
                            value={tokenName}
                            onChange={(e) => setTokenName(e.target.value)}
                            placeholder="e.g., CI/CD Bot, Budget Tracker"
                            maxLength={50}
                            className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-app-text outline-none transition-all focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20"
                        />
                    </div>

                    {/* Wallet permissions */}
                    <div>
                        <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-app-muted">
                            Wallet Permissions
                        </label>

                        {walletPerms.length === 0 ? (
                            <div className="flex items-center justify-center py-6">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-app-border border-t-[#a78bfa]" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                {walletPerms.map(wp => (
                                    <div
                                        key={wp.walletId}
                                        className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                                            wp.enabled
                                                ? 'border-[#a78bfa]/40 bg-[#a78bfa]/5'
                                                : 'border-app-border bg-app-input/30 opacity-60 hover:opacity-80'
                                        }`}
                                        onClick={() => toggleWallet(wp.walletId)}
                                    >
                                        <div className="flex items-center justify-between">
                                            {/* Wallet info */}
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                                                    style={{ backgroundColor: (wp.walletColor || '#6b7280') + '20' }}
                                                >
                                                    {wp.walletIcon || '💰'}
                                                </div>
                                                <span className="text-sm font-semibold text-app-text">{wp.walletName}</span>
                                            </div>

                                            {/* Toggle indicator */}
                                            <div
                                                className={`h-5 w-9 rounded-full transition-all ${
                                                    wp.enabled ? 'bg-[#a78bfa]' : 'bg-app-border'
                                                }`}
                                            >
                                                <div
                                                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                                        wp.enabled ? 'translate-x-4' : 'translate-x-0'
                                                    }`}
                                                />
                                            </div>
                                        </div>

                                        {/* Permission toggles (shown when enabled) */}
                                        {wp.enabled && (
                                            <div
                                                className="mt-3 flex items-center gap-4 pl-12"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* READ (always on when enabled) */}
                                                <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-400/15 px-2.5 py-1 text-[11px] font-bold text-cyan-400">
                                                    <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                                    Read
                                                </span>

                                                {/* WRITE toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleWrite(wp.walletId)}
                                                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                                                        wp.write
                                                            ? 'bg-amber-400/15 text-amber-400'
                                                            : 'bg-app-bg/60 text-app-muted hover:text-app-text'
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

                    {/* Create button (mobile fallback, desktop uses the header action) */}
                    <button
                        id="pat-create-btn"
                        onClick={handleCreate}
                        disabled={creating || !tokenName.trim() || walletPerms.filter(w => w.enabled).length === 0}
                        className="w-full rounded-xl bg-[#a78bfa] py-3 text-sm font-bold text-white transition-all hover:bg-[#8b5cf6] disabled:opacity-40 disabled:cursor-not-allowed sm:hidden"
                    >
                        {creating ? 'Generating...' : 'Generate Token'}
                    </button>
                </div>
            )}

            {/* ══════════════ SHOW TOKEN VIEW ══════════════ */}
            {view === 'showToken' && (
                <div className="space-y-5">
                    {/* Warning banner */}
                    <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                        <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="mt-0.5 shrink-0 text-amber-400"
                        />
                        <div>
                            <p className="text-sm font-bold text-amber-300">Copy your token now!</p>
                            <p className="mt-0.5 text-xs text-amber-300/70">
                                This token will only be shown once. You won't be able to see it again after closing this dialog.
                            </p>
                        </div>
                    </div>

                    {/* Token display */}
                    <div className="relative">
                        <div className="rounded-xl border border-app-border bg-app-bg p-4 pr-14">
                            <code
                                id="pat-generated-token"
                                className="block w-full break-all text-sm font-mono text-[#00ff7f] leading-relaxed select-all"
                            >
                                {generatedToken}
                            </code>
                        </div>

                        {/* Copy button */}
                        <button
                            id="pat-copy-btn"
                            onClick={handleCopy}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                                copied
                                    ? 'bg-[#00ff7f]/15 text-[#00ff7f]'
                                    : 'bg-app-input text-app-muted hover:bg-app-border hover:text-app-text'
                            }`}
                            title="Copy to clipboard"
                        >
                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-sm" />
                        </button>
                    </div>

                    {/* Done button */}
                    <button
                        id="pat-done-btn"
                        onClick={() => {
                            setView('list');
                            fetchTokens();
                        }}
                        className="w-full rounded-xl border border-app-border bg-app-input py-3 text-sm font-semibold text-app-text transition-all hover:bg-app-border"
                    >
                        I've copied the token
                    </button>
                </div>
            )}
        </ModalDialog>
    );
});
