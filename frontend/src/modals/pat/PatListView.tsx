import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faPlus, faTrashAlt, faClock, faPen, faEye } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../../components/Icon';
import type { Wallet } from '../../utils/types';
import type { PatToken } from './patTypes';

interface PatListViewProps {
    loadingTokens: boolean;
    tokens: PatToken[];
    walletsMap: Record<string, Wallet>;
    revokingId: string | null;
    onRevoke: (tokenId: string) => void;
    onCreate: () => void;
    onEdit: (token: PatToken) => void;
}

export const PatListView: React.FC<PatListViewProps> = ({
    loadingTokens,
    tokens,
    walletsMap,
    revokingId,
    onRevoke,
    onCreate,
    onEdit
}) => {
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

    if (loadingTokens) {
        return (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-app-border border-t-[#a78bfa]" />
                </div>
            </div>
        );
    }

    if (tokens.length === 0) {
        return (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-app-input">
                        <FontAwesomeIcon icon={faKey} className="text-2xl text-app-muted" />
                    </div>
                    <p className="text-sm font-semibold text-app-muted">No API tokens yet</p>
                    <p className="mt-1 text-xs text-app-muted/70">
                        Create a token to access your data via MCP
                    </p>
                    <button
                        onClick={onCreate}
                        className="mt-4 rounded-xl bg-[#a78bfa]/20 px-4 py-2 text-sm font-bold text-[#a78bfa] transition-all hover:bg-[#a78bfa]/30"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Create Token
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {tokens.map(token => (
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

                        <div className="flex shrink-0 gap-2">
                            <button
                                onClick={() => onEdit(token)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted/50 transition-all hover:bg-[#a78bfa]/15 hover:text-[#a78bfa]"
                                title="Edit permissions"
                            >
                                <FontAwesomeIcon icon={faPen} className="text-xs" />
                            </button>
                            <button
                                onClick={() => onRevoke(token.id)}
                                disabled={revokingId === token.id}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted/50 transition-all hover:bg-[#ff4d4d]/15 hover:text-[#ff4d4d] disabled:opacity-40"
                                title="Revoke token"
                            >
                                <FontAwesomeIcon
                                    icon={faTrashAlt}
                                    className={`text-xs ${revokingId === token.id ? 'animate-pulse' : ''}`}
                                />
                            </button>
                        </div>
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
                                        {wallet?.icon && (
                                            <Icon icon={wallet.icon} color={wallet.color} className="text-[10px] w-3 h-3" />
                                        )}
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
    );
};
