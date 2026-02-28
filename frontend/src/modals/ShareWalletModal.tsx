import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import api from '../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEye, faPen, faShareNodes, faUser} from '@fortawesome/free-solid-svg-icons';
import {ModalDialog} from './ModalDialog';
import {triggerToast} from '../components/ToastNotification';
import type {Wallet} from "../utils/types.ts";

export interface ShareWalletModalHandle {
    openModal: () => void;
}

interface Props {
    wallet: Wallet;
}

export const ShareWalletModal = forwardRef<ShareWalletModalHandle, Props>(
    ({ wallet }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);

        const [identifier, setIdentifier] = useState('');
        const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
        const [loading, setLoading] = useState(false);

        useImperativeHandle(ref, () => ({
            openModal: () => {
                setIdentifier('');
                setRole('VIEWER'); // Reset di default
                dialogRef.current?.showModal();
            }
        }));

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            if (identifier.trim().length < 3) {
                return triggerToast("Please enter a valid username or email.", false);
            }

            setLoading(true);
            try {
                // TODO: Assicurati che l'endpoint combaci con quello del tuo backend Java!
                await api.post(`/wallets/${wallet.id}/share`, {
                    identifier: identifier.trim(),
                    role: role
                });

                triggerToast(`Wallet shared successfully with ${identifier}!`, true);
                if (dialogRef.current?.open) dialogRef.current.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error sharing wallet", false);
            } finally {
                setLoading(false);
            }
        };

        console.log(wallet)

        if (!wallet)
            return 

        return (
            <ModalDialog ref={dialogRef} className="max-w-[450px]">
                <div className="text-center">
                    <h3 className="mb-2 flex items-center justify-center gap-3 text-xl font-semibold text-white/80">
                        <FontAwesomeIcon icon={faShareNodes} style={{ color: wallet.color }} />
                        Share "{wallet.name}"
                    </h3>
                    <p className="mb-6 text-sm text-white/50">
                        Invite someone to view or edit this wallet.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">

                        {/* 1. Input Username/Email */}
                        <div>
                            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                <FontAwesomeIcon icon={faUser} className="mr-2" />
                                User Email or Username *
                            </label>
                            <input
                                className="h-[48px] w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition-all"
                                style={{ focusBorderColor: wallet.color } as React.CSSProperties} // Fix rapido per il colore
                                type="text"
                                placeholder="e.g. mario.rossi@email.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>

                        {/* 2. Selezione Ruolo */}
                        <div>
                            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-white/50">
                                Permission Role
                            </label>
                            <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 w-full">
                                <button
                                    type="button"
                                    onClick={() => setRole('VIEWER')}
                                    className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        role === 'VIEWER'
                                            ? 'bg-white/10 text-white shadow-sm'
                                            : 'text-white/40 hover:text-white/70'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                    Viewer
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('EDITOR')}
                                    className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                        role === 'EDITOR'
                                            ? 'bg-amber-400/20 text-amber-400 shadow-sm'
                                            : 'text-white/40 hover:text-white/70'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faPen} />
                                    Editor
                                </button>
                            </div>
                            <p className="mt-2 text-[10px] text-white/40 text-center">
                                {role === 'VIEWER'
                                    ? "Viewers can only read transactions and statistics."
                                    : "Editors can add, edit, and delete transactions."}
                            </p>
                        </div>

                        {/* 3. Azioni */}
                        <div className="flex gap-4 pt-2 border-t border-white/10">
                            <button
                                type="button"
                                className="flex-1 rounded-xl bg-white/5 py-3 font-bold text-white transition-colors hover:bg-white/10"
                                onClick={() => { if (dialogRef.current?.open) dialogRef.current.close() }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || identifier.trim().length < 3}
                                className="flex-[1.5] rounded-xl py-3 font-bold text-black transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
                                style={{
                                    backgroundColor: wallet.color,
                                    boxShadow: `0 8px 15px -5px ${wallet.color}66`
                                }}
                            >
                                {loading ? "Sharing..." : "Share Wallet"}
                            </button>
                        </div>

                    </form>
                </div>
            </ModalDialog>
        );
    }
);