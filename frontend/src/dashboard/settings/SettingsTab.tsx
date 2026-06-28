import React, { useState } from 'react';
import { useWalletContext } from '../wallet/WalletContext.tsx';
import { IconPickerButton } from '../../components/icon/IconPickerButton.tsx';
import type { IconKey } from '../../utils/icons.ts';
import { faExclamationTriangle, faGear, faSave, faSignOutAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { Wallet } from '../../utils/types';
import { ShareSettingsSection } from './ShareSettingsSection.tsx';
import { SettingsCard } from '../../components/settings/SettingsCard.tsx';
import { DataTab } from './DataTab.tsx';

export const SettingsTab: React.FC = () => {
    const { wallet, handleUpdateWallet, onWalletDelete } = useWalletContext();
    const [isSaving, setIsSaving] = useState(false);

    const [editedWallet, setEditedWallet] = useState<Partial<Wallet>>({
        name: wallet.name,
        color: wallet.color,
        icon: wallet.icon
    });
    const [showIconPicker, setShowIconPicker] = useState(false);

    const hasChanges = editedWallet.name !== wallet.name || editedWallet.color !== wallet.color || editedWallet.icon !== wallet.icon;

    const handleSave = async () => {
        if (!editedWallet.name?.trim()) return;
        setIsSaving(true);
        await handleUpdateWallet(editedWallet);
        setIsSaving(false);
    };

    return (
        <div
            className="flex flex-col gap-6 pb-6 animate-[fadeIn_0.3s_ease-out]">

            {/* GENERAL SETTINGS CARD */}
            {wallet.userRole !== 'VIEWER' && (
                <SettingsCard
                    title="General Settings"
                    subtitle="Change Icon, Color, and Name of your Wallet"
                    icon={faGear}
                    actionText="Save Changes"
                    actionIcon={faSave}
                    actionColor="var(--color-app-green)"
                    onAction={handleSave}
                    actionDisabled={!hasChanges || isSaving || !editedWallet.name?.trim()}
                    isActionLoading={isSaving}
                >
                    {/* CONTENITORE: Affiancati sempre */}
                    <div className="flex flex-row gap-4 sm:gap-8 items-start sm:py-2">
                        {/* ICON & COLOR PICKER */}
                        <div className="flex flex-col items-start gap-3 shrink-0">
                            {/*<label className="text-xs font-bold uppercase tracking-wider text-app-muted">Icon &*/}
                            {/*    Color</label>*/}
                            <div
                                className="relative p-1 bg-app-input rounded-2xl border border-app-border shadow-inner self-start">
                                <IconPickerButton
                                    icon={editedWallet.icon as IconKey}
                                    color={editedWallet.color as string}
                                    onIconChange={(icon: IconKey) => setEditedWallet({ ...editedWallet, icon })}
                                    onColorChange={(color: string) => setEditedWallet({ ...editedWallet, color })}
                                    isOpen={showIconPicker}
                                    onToggle={setShowIconPicker}
                                />
                            </div>
                        </div>

                        {/* WALLET NAME INPUT */}
                        <div className="flex flex-col gap-3 flex-1">
                            {/*<label*/}
                            {/*    className="text-xs font-bold uppercase tracking-wider text-app-muted">*/}
                            {/*    Wallet Name*/}
                            {/*</label>*/}
                            <input
                                type="text"
                                value={editedWallet.name}
                                onChange={(e) => setEditedWallet({ ...editedWallet, name: e.target.value })}
                                className="w-full bg-app-input border border-app-border rounded-xl px-4 py-3 text-app-text placeholder-app-muted focus:outline-none focus:border-app-green focus:ring-1 focus:ring-app-green transition-all font-medium"
                                placeholder="e.g. Main Account, Savings, Crypto..."
                            />
                        </div>
                    </div>
                </SettingsCard>
            )}

            <DataTab />

            {/* SHARE & MEMBERS SETTINGS */}
            <ShareSettingsSection />

            {/* DANGER ZONE CARD */}
            {wallet.userRole === 'OWNER' ? (
                <SettingsCard
                    title="Danger Zone"
                    icon={faExclamationTriangle}
                    danger={true}
                    headerCentered={true}
                    description={
                        <p className="text-center max-w-lg mx-auto">
                            Permanently delete this wallet. This action will destroy all associated transactions, tags,
                            and history. <strong>This cannot be undone.</strong>
                        </p>
                    }
                    actionText="Delete Wallet"
                    actionIcon={faTrash}
                    onAction={onWalletDelete}
                />
            ) : (
                <SettingsCard
                    title="Danger Zone"
                    icon={faSignOutAlt}
                    danger={true}
                    headerCentered={true}
                    description={
                        <p className="text-center max-w-lg mx-auto">
                            Remove your access to this wallet. You will no longer be able to view or edit anything. You
                            will need to ask the owner to invite you again to regain access.
                        </p>
                    }
                    actionText="Quit Wallet"
                    actionIcon={faSignOutAlt}
                    onAction={onWalletDelete}
                />
            )}

        </div>
    );
};