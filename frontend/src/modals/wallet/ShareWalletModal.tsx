import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import api from '../../api/axiosConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPen, faShareNodes, faUser, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from '../common/ModalDialog';
import { triggerToast } from '../../components/ui/ToastNotification.tsx';
import type { Wallet } from "../../utils/types";

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

        const handleSubmit = async () => {
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
            <ModalDialog
                ref={dialogRef}
                className="max-w-112.5"
                title={<><FontAwesomeIcon icon={faShareNodes} style={{ color: wallet.color }} /> Share "{wallet.name}"</>}
                subtitle="Invite someone to view or edit this wallet."
                rightActions={[
                    {
                        icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
                        onClick: async () => {
                            if (!loading && identifier.trim().length >= 3)
                                await handleSubmit();
                        },
                        hoverColor: 'hover:text-[#00ff7f]',
                        disabled: loading || identifier.trim().length < 3
                    }
                ]}
            >
                <div id="share-wallet-form" onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">

                    {/* 1. Input Username/Email */}
                    <div>
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                            <FontAwesomeIcon icon={faUser} className="mr-2" />
                            User Email or Username *
                        </label>
                        <input
                            className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-white outline-none transition-all"
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
                        <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
                            Permission Role
                        </label>
                        <div className="flex rounded-xl bg-black/40 p-1 border border-app-border w-full">
                            <button
                                type="button"
                                onClick={() => setRole('VIEWER')}
                                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${role === 'VIEWER'
                                    ? 'bg-app-surface text-white shadow-sm'
                                    : 'text-app-muted hover:text-app-muted'
                                    }`}
                            >
                                <FontAwesomeIcon icon={faEye} />
                                Viewer
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('EDITOR')}
                                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${role === 'EDITOR'
                                    ? 'bg-amber-400/20 text-amber-400 shadow-sm'
                                    : 'text-app-muted hover:text-app-muted'
                                    }`}
                            >
                                <FontAwesomeIcon icon={faPen} />
                                Editor
                            </button>
                        </div>
                        <p className="mt-2 text-[10px] text-app-muted text-center">
                            {role === 'VIEWER'
                                ? "Viewers can only read transactions and statistics."
                                : "Editors can add, edit, and delete transactions."}
                        </p>
                    </div>

                </div>
            </ModalDialog >
        );
    }
);