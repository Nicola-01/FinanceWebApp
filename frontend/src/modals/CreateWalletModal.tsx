import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import api from '../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faWallet} from '@fortawesome/free-solid-svg-icons';
import {ModalDialog} from './ModalDialog';
import {triggerToast} from '../components/ToastNotification';
import type {CurrencyCode} from '../utils/currencies.ts';

// Importiamo i nostri nuovi componenti puliti!
import {type IconKey, ICONS} from '../utils/icons.ts';
import {CurrencySelector} from '../components/CurrencySelector';
import {IconColorSelector} from "../components/IconColorSelector.tsx";

// import {IconPickerButton} from "../components/IconPickerButton.tsx";

export interface CreateWalletModalHandle {
    openModal: () => void;
}

interface Props {
    onSuccess: (walletId: string) => void;
}

export const CreateWalletModal = forwardRef<CreateWalletModalHandle, Props>(
    ({onSuccess}, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        // Stati
        const [name, setName] = useState('');
        const [iconKey, setIconKey] = useState<IconKey>('wallet');
        const [color, setColor] = useState('#00ff7f');
        const [currency, setCurrency] = useState<CurrencyCode>('EUR');
        const [loading, setLoading] = useState(false);
        const [showSelectors, setShowSelectors] = useState(false);

        const selectorRef = useRef<HTMLDivElement>(null);
        const buttonRef = useRef<HTMLButtonElement>(null);

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setName('');
                setIconKey('wallet');
                setColor('#00ff7f');
                setCurrency('EUR');
                dialogRef.current?.showModal();
            }
        }));

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as Node
                if (
                    selectorRef.current && !selectorRef.current.contains(target) &&
                    buttonRef.current && !buttonRef.current.contains(target)
                ) {
                    setShowSelectors(false);
                }
            };

            if (showSelectors)
                document.addEventListener('mousedown', handleClickOutside);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [showSelectors]);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!name) return triggerToast("WalletCard name is required", false);

            setLoading(true);
            try {
                // Il backend riceverà la chiave testuale dell'icona (es. "piggyBank")
                const response = await api.post('/wallets', {name, icon: iconKey, color, currency});
                triggerToast("WalletCard created successfully!", true);
                onSuccess(response.data.id);
                dialogRef.current?.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error creating wallet", false);
            } finally {
                setLoading(false);
            }
        };

        // @ts-ignore
        return (
            <ModalDialog ref={dialogRef}>
                <div className="text-center">
                    <h3 className="mb-2 flex items-center justify-center gap-3 text-2xl font-semibold text-white">
                        <FontAwesomeIcon icon={faWallet} className="text-[#00ff7f]"/> New Wallet
                    </h3>
                    <p className="mb-6 text-sm text-white/60">Organize your finances with a custom wallet.</p>

                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                        {/* Anteprima Icona Real-time */}
                        <div className="relative mb-6 flex flex-col items-center">

                            <button
                                ref={buttonRef}
                                type="button"
                                onClick={() => setShowSelectors(!showSelectors)}
                                className="group flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/10"
                                style={{color: color}}
                                title="Change Icon or Color"
                            >
                                <FontAwesomeIcon icon={ICONS[iconKey]}/>
                            </button>

                            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
                                Click icon to edit
                            </span>

                            {showSelectors && (
                                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50">
                                    <IconColorSelector ref={selectorRef}
                                                       iconValue={iconKey}
                                                       onChangeIcon={setIconKey}
                                                       colorValue={color}
                                                       onChangeColor={setColor}
                                    />
                                </div>
                            )}
                        </div>

                        {/*<IconPickerButton*/}
                        {/*    icon={iconKey} color={color}*/}
                        {/*    onIconChange={setIconKey}*/}
                        {/*    onColorChange={setColor}*/}
                        {/*    isOpen={showSelectors} onToggle={setShowSelectors}*/}
                        {/*/>*/}

                        <div>
                            <label
                                className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">Wallet
                                Name</label>
                            <input
                                className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all focus:border-[#00ff7f]"
                                type="text"
                                placeholder="e.g. Personal Savings"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>


                        {/* Input Valuta */}
                        <CurrencySelector value={currency} onChange={setCurrency}/>

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
                                {loading ? "Creating..." : "Create WalletCard"}
                            </button>
                        </div>
                    </form>
                </div>
            </ModalDialog>
        );
    }
);