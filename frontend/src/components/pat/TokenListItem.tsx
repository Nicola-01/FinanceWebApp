import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faArrowRight, faPen, faEye, faTrash, faBan, faCopy } from '@fortawesome/free-solid-svg-icons';
import type { Wallet, PatToken, ThemeVariant } from '../../utils/types';

interface TokenListItemProps {
    token: PatToken;
    walletsMap: Record<string, Wallet>;
    onClick?: (token: PatToken) => void;
    onDelete?: (token: PatToken) => void;
    onRevoke?: (token: PatToken) => void; // for backward compatibility in PatListView
    onEdit?: (token: PatToken) => void;
    disabled?: boolean;
    theme?: ThemeVariant;
    showActions?: boolean;
    showCopy?: boolean;
    onCopy?: (prefix: string) => void;
    revokingId?: string | null;
}

export const TokenListItem: React.FC<TokenListItemProps> = ({
    token,
    walletsMap,
    onClick,
    onDelete,
    onRevoke,
    onEdit,
    disabled,
    theme = 'default',
    showActions = true,
    showCopy = false,
    onCopy,
    revokingId
}) => {
    const isOauth = theme === 'oauth';
    
    // Fallback for onDelete if onRevoke is passed
    const handleDelete = onDelete || onRevoke;

    const Wrapper = onClick ? 'button' : 'div';
    const wrapperProps = onClick ? {
        onClick: () => onClick(token),
        disabled,
        type: 'button' as const
    } : {};

    return (
        <Wrapper
            {...wrapperProps}
            className={`w-full group rounded-xl border p-3.5 text-left transition-all ${
                isOauth
                    ? 'border-white/5 bg-white/[0.03] hover:border-[#a78bfa]/30 hover:bg-[#a78bfa]/5 disabled:opacity-40 disabled:cursor-not-allowed'
                    : onClick 
                        ? 'border-app-border bg-app-input hover:border-[#a78bfa]/50 disabled:opacity-40 disabled:cursor-not-allowed'
                        : 'border-app-border bg-app-input hover:border-[#a78bfa]/50'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isOauth ? 'bg-[#a78bfa]/10' : 'bg-app-bg'
                    }`}>
                        <FontAwesomeIcon icon={faKey} className={isOauth ? "text-lg text-[#a78bfa]" : "text-lg text-app-muted"} />
                    </div>
                    <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isOauth ? 'text-white' : 'text-app-text'}`}>
                            {token.name}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className={`text-[11px] font-mono truncate ${isOauth ? 'text-white/30' : 'text-app-muted'}`}>
                                {token.tokenPrefix}...
                            </p>
                            {showCopy && onCopy && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onCopy(token.tokenPrefix); }}
                                    className="text-[10px] text-app-muted hover:text-app-text transition-colors"
                                    title="Copy Prefix"
                                >
                                    <FontAwesomeIcon icon={faCopy} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {onClick && isOauth && (
                    <FontAwesomeIcon
                        icon={faArrowRight}
                        className="text-xs text-white/20 group-hover:text-[#a78bfa] transition-colors self-center"
                    />
                )}

                {showActions && !isOauth && (onEdit || handleDelete) && (
                    <div className="flex shrink-0 gap-2">
                        {onEdit && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onEdit(token); }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted/50 transition-all hover:bg-[#a78bfa]/15 hover:text-[#a78bfa]"
                                title="Edit permissions"
                            >
                                <FontAwesomeIcon icon={faPen} className="text-xs" />
                            </button>
                        )}
                        {handleDelete && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDelete(token); }}
                                disabled={revokingId === token.id}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted/50 transition-all hover:bg-[#ff4d4d]/15 hover:text-[#ff4d4d] disabled:opacity-40"
                                title="Revoke Token"
                            >
                                <FontAwesomeIcon 
                                    icon={faTrash} 
                                    className={`text-xs ${revokingId === token.id ? 'animate-pulse' : ''}`} 
                                />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Wallet badges */}
            {token.walletPermissions && token.walletPermissions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pl-[52px]">
                    {token.walletPermissions.map(wp => {
                        const wallet = walletsMap[wp.walletId];
                        return (
                            <span
                                key={wp.walletId}
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                    isOauth ? 'bg-white/5 text-white/40' : 'bg-app-bg text-app-muted border border-app-border'
                                }`}
                            >
                                {wallet?.icon && <span className="text-[10px]">{wallet.icon}</span>}
                                {wp.permissions?.includes('WRITE') ? (
                                    <FontAwesomeIcon icon={faPen} className="text-amber-400 text-[8px]" />
                                ) : wp.permissions?.includes('READ') ? (
                                    <FontAwesomeIcon icon={faEye} className="text-cyan-400 text-[8px]" />
                                ) : (
                                    <FontAwesomeIcon icon={faBan} className="text-red-400 text-[8px]" />
                                )}
                                {wallet?.name || wp.walletId.substring(0, 8) + '...'}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Last used info (only for default theme) */}
            {!isOauth && (
                <div className="mt-3 flex items-center justify-between pl-[52px]">
                    <p className="text-[10px] text-app-muted">
                        Created: {new Date(token.createdAt).toLocaleDateString()}
                    </p>
                    {token.lastUsedAt && (
                        <p className="text-[10px] text-app-muted">
                            Last used: {new Date(token.lastUsedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            )}
        </Wrapper>
    );
};
