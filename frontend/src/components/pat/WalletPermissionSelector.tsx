import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPen, faBan } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../icon/Icon.tsx';
import type { WalletPermState } from '../../utils/types';

interface WalletPermissionSelectorProps {
    walletPerms: WalletPermState[];
    setPermission: (walletId: string, level: 'none' | 'read' | 'write') => void;
}

export const WalletPermissionSelector: React.FC<WalletPermissionSelectorProps> = ({
    walletPerms,
    setPermission
}) => {

    return (
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
                            <span className="text-sm font-semibold text-app-text">
                                {wp.walletName}
                            </span>
                        </div>

                        {/* Segmented Control */}
                        <div className="flex rounded-lg p-1 border bg-app-bg border-app-border">
                            <button
                                type="button"
                                onClick={() => setPermission(wp.walletId, 'none')}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                                    !wp.enabled
                                        ? 'bg-app-input text-app-red shadow-sm'
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
                                        ? 'bg-app-input theme-text-primary shadow-sm'
                                        : 'text-app-muted hover:text-app-text'
                                }`}
                            >
                                <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                Read
                            </button>

                            <button
                                type="button"
                                onClick={() => setPermission(wp.walletId, 'write')}
                                disabled={wp.userRole === 'VIEWER'}
                                title={wp.userRole === 'VIEWER' ? "Non hai il permesso editor dal owner del wallet" : undefined}
                                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                                    wp.userRole === 'VIEWER'
                                        ? 'opacity-40 cursor-not-allowed text-app-muted'
                                        : wp.enabled && wp.write
                                            ? 'bg-app-input theme-text-warning shadow-sm'
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
    );
};
