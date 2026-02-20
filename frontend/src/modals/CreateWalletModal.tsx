import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import api from '../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { triggerToast } from '../components/ToastNotification';
import type {CurrencyCode} from '../utils/currencies.ts';

// Importiamo i nostri nuovi componenti puliti!
import { WALLET_ICONS, type WalletIconKey } from '../utils/walletIcons';
import { IconSelector } from '../components/IconSelector';
import { ColorSelector } from '../components/ColorSelector';
import { CurrencySelector } from '../components/CurrencySelector';

export interface CreateWalletModalHandle {
    openModal: () => void;
}

interface Props {
    onSuccess: () => void;
}

export const CreateWalletModal = forwardRef<CreateWalletModalHandle, Props>(
    ({ onSuccess }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // Stati
        const [name, setName] = useState('');
        const [iconKey, setIconKey] = useState<WalletIconKey>('wallet');
        const [color, setColor] = useState('#00ff7f');
        const [currency, setCurrency] = useState<CurrencyCode>('EUR');
        const [loading, setLoading] = useState(false);

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setName('');
                setIconKey('wallet');
                setColor('#00ff7f');
                setCurrency('EUR');
                dialogRef.current?.showModal();
            }
        }));

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!name) return triggerToast("Wallet name is required", false);

            setLoading(true);
            try {
                // Il backend riceverà la chiave testuale dell'icona (es. "piggyBank")
                await api.post('/api/wallets', { name, icon: iconKey, color, currency });
                triggerToast("Wallet created successfully!", true);
                onSuccess();
                dialogRef.current?.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error creating wallet", false);
            } finally {
                setLoading(false);
            }
        };

        return (
            <ModalDialog ref={dialogRef}>
                <div className="text-center">
                    <h3 className="mb-2 flex items-center justify-center gap-3 text-2xl font-semibold text-white">
                        <FontAwesomeIcon icon={faPlus} className="text-[#00ff7f]" /> New Wallet
                    </h3>
                    <p className="mb-6 text-sm text-white/60">Organize your finances with a custom wallet.</p>

                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                        {/* Anteprima Icona Real-time */}
                        <div className="flex justify-center mb-6">
                            <div
                                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl shadow-lg transition-colors duration-300"
                                style={{ color: color }}
                            >
                                <FontAwesomeIcon icon={WALLET_ICONS[iconKey]} />
                            </div>
                        </div>

                        {/* Input Nome */}
                        <div>
                            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Wallet Name</label>
                            <input
                                className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                                type="text"
                                placeholder="e.g. Personal Savings"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Riga con Icona e Colore affiancati */}
                        <div className="grid grid-cols-2 gap-4">
                            <IconSelector value={iconKey} onChange={setIconKey} />
                            <ColorSelector value={color} onChange={setColor} />
                        </div>

                        {/* Input Valuta */}
                        <CurrencySelector value={currency} onChange={setCurrency} />

                        {/* Pulsanti Finali */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                className="w-1/3 rounded-xl bg-white/5 py-3 font-bold text-white transition-colors hover:bg-white/10"
                                onClick={() => dialogRef.current?.close()}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-2/3 rounded-xl bg-[#00ff7f] py-3 font-bold text-black shadow-lg shadow-[#00ff7f]/20 transition-all hover:-translate-y-0.5 hover:bg-[#00e673]"
                            >
                                {loading ? "Creating..." : "Create Wallet"}
                            </button>
                        </div>
                    </form>
                </div>
            </ModalDialog>
        );
    }
);