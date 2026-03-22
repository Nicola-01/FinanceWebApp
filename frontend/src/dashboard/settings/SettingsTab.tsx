import React, { useState } from 'react';
import { useWalletContext } from '../wallet/WalletContext.tsx';
import { IconPickerButton } from '../../components/IconPickerButton.tsx';
import type { IconKey } from '../../utils/icons.ts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTrash, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import type { Wallet } from '../../utils/types';

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
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar animate-[fadeIn_0.3s_ease-out]">

            {/* GENERAL SETTINGS CARD */}
            <div className="flex flex-col gap-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">

                <div className="flex items-center justify-center sm:justify-start border-b border-white/5 pb-4">
                    <h2 className="text-xl font-bold text-white">General Settings</h2>
                </div>

                {/* CONTENITORE VERTICALE PER ICONA E NOME */}
                <div className="flex flex-col gap-8 items-center py-4">

                    {/* ICON & COLOR PICKER (Centrato in alto stile "Avatar") */}
                    <div className="flex flex-col items-center gap-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/40">Icon & Color</label>
                        {/* Contenitore per dare risalto all'icona slegandola dall'input */}
                        <div className="relative p-2 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
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

                    {/* WALLET NAME INPUT (Sotto, a larghezza controllata) */}
                    <div className="flex flex-col gap-2 w-full max-w-xl">
                        <label className="text-xs font-bold uppercase tracking-wider text-white/40 text-center sm:text-left">
                            Wallet Name
                        </label>
                        <input
                            type="text"
                            value={editedWallet.name}
                            onChange={(e) => setEditedWallet({ ...editedWallet, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00ff7f] focus:ring-1 focus:ring-[#00ff7f] transition-all font-medium text-center sm:text-left"
                            placeholder="e.g. Main Account, Savings, Crypto..."
                        />
                    </div>

                </div>

                {/* SAVE BUTTON (Centrato) */}
                <div className="flex justify-center pt-6 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving || !editedWallet.name?.trim()}
                        className="flex items-center justify-center gap-2 bg-[#00ff7f] text-black hover:bg-[#00cc66] disabled:opacity-50 disabled:bg-[#00ff7f]/20 disabled:text-[#00ff7f] px-10 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(0,255,127,0.3)] hover:shadow-[0_0_20px_rgba(0,255,127,0.5)] disabled:shadow-none w-full sm:w-auto"
                    >
                        {isSaving ? (
                            <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
                        ) : (
                            <FontAwesomeIcon icon={faSave} className="text-lg" />
                        )}
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* DANGER ZONE CARD */}
            <div className="flex flex-col items-center text-center gap-5 bg-red-500/5 border border-red-500/20 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group mt-2">
                {/* Sfondo decorativo spostato al centro per supportare il nuovo allineamento */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl transition-all group-hover:bg-red-500/20 pointer-events-none"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-xl" />
                    <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                </div>

                <p className="text-white/60 text-sm max-w-lg relative z-10">
                    Permanently delete this wallet. This action will destroy all associated transactions, tags, and history. <strong>This cannot be undone.</strong>
                </p>

                {/* DELETE BUTTON (Centrato) */}
                <div className="flex justify-center pt-2 relative z-10 w-full">
                    <button
                        onClick={onWalletDelete}
                        className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-8 py-3 rounded-xl font-bold transition-all w-full sm:w-auto"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                        Delete Wallet
                    </button>
                </div>
            </div>

        </div>
    );
};