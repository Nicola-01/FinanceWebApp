import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPen, faBan } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../../components/Icon';
import type { WalletPermState } from './patTypes';

interface PatFormViewProps {
    isEdit: boolean;
    tokenName: string;
    setTokenName: (val: string) => void;
    walletPerms: WalletPermState[];
    setPermission: (walletId: string, level: 'none' | 'read' | 'write') => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

export const PatFormView: React.FC<PatFormViewProps> = ({
    isEdit,
    tokenName,
    setTokenName,
    walletPerms,
    setPermission,
    onSubmit,
    isSubmitting
}) => {
    return (
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
                    disabled={isEdit}
                    className={`h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-app-text outline-none transition-all focus:border-[#a78bfa] focus:ring-2 focus:ring-[#a78bfa]/20 ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {walletPerms.map(wp => (
                            <div
                                key={wp.walletId}
                                className={`rounded-xl border p-3.5 transition-all ${
                                    wp.enabled
                                        ? 'border-[#a78bfa]/40 bg-[#a78bfa]/5'
                                        : 'border-app-border bg-app-input/30'
                                }`}
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Wallet info */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                                            style={{ backgroundColor: (wp.walletColor || '#6b7280') + '20' }}
                                        >
                                            <Icon icon={wp.walletIcon} color={wp.walletColor} />
                                        </div>
                                        <span className="text-sm font-semibold text-app-text">{wp.walletName}</span>
                                    </div>

                                    {/* Segmented Control */}
                                    <div className="flex rounded-lg bg-app-bg p-1 border border-app-border">
                                        <button
                                            type="button"
                                            onClick={() => setPermission(wp.walletId, 'none')}
                                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                                                !wp.enabled
                                                    ? 'bg-app-input text-[#ff4d4d] shadow-sm'
                                                    : 'text-app-muted hover:text-app-text'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faBan} className="text-[10px]" />
                                            Unauthorized
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPermission(wp.walletId, 'read')}
                                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                                                wp.enabled && !wp.write
                                                    ? 'bg-app-input text-cyan-400 shadow-sm'
                                                    : 'text-app-muted hover:text-app-text'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                            Read
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPermission(wp.walletId, 'write')}
                                            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                                                wp.enabled && wp.write
                                                    ? 'bg-app-input text-amber-400 shadow-sm'
                                                    : 'text-app-muted hover:text-app-text'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                            Write
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create button (mobile fallback, desktop uses the header action) */}
            <button
                id="pat-create-btn"
                onClick={onSubmit}
                disabled={isSubmitting || !tokenName.trim() || walletPerms.filter(w => w.enabled).length === 0}
                className="w-full rounded-xl bg-[#a78bfa] py-3 text-sm font-bold text-white transition-all hover:bg-[#8b5cf6] disabled:opacity-40 disabled:cursor-not-allowed sm:hidden"
            >
                {isSubmitting ? (isEdit ? 'Saving...' : 'Generating...') : (isEdit ? 'Save Changes' : 'Generate Token')}
            </button>
        </div>
    );
};
