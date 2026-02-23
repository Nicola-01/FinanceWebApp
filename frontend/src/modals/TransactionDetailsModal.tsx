import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPenToSquare, faTrash, faArrowRightArrowLeft, faStickyNote } from '@fortawesome/free-solid-svg-icons';
import { ModalDialog } from './ModalDialog';
import { WALLET_ICONS, type WalletIconKey } from '../utils/walletIcons';
import type { Transaction } from '../utils/types';
import api from '../api/axiosConfig';
import { triggerToast } from '../components/ToastNotification';

export interface TransactionDetailsModalHandle {
    openModal: (tx: Transaction) => void;
}

interface Props {
    walletId: string;
    onSuccess: () => void;
    onEdit: (tx: Transaction) => void;
}

export const TransactionDetailsModal = forwardRef<TransactionDetailsModalHandle, Props>(
    ({ walletId, onSuccess, onEdit }, ref) => {
        const dialogRef = useRef<HTMLDialogElement>(null);
        const [transaction, setTransaction] = useState<Transaction | null>(null);

        useImperativeHandle(ref, () => ({
            openModal: (tx) => {
                setTransaction(tx);
                dialogRef.current?.showModal();
            }
        }));

        const handleDelete = async () => {
            if (!transaction) return;
            if (!window.confirm("Are you sure you want to delete this transaction?")) return;

            try {
                await api.delete(`/transactions/${walletId}/${transaction.id}`);
                triggerToast("Transaction deleted successfully", true);
                onSuccess();
                dialogRef.current?.close();
            } catch (err: any) {
                triggerToast(err.response?.data?.title || "Error deleting transaction", false);
            }
        };

        const handleEdit = () => {
            if (transaction) {
                dialogRef.current?.close();
                onEdit(transaction);
            }
        };

        if (!transaction) return null;

        const isIncome = transaction.type === 'INCOME';

        return (
            <ModalDialog ref={dialogRef} className="max-w-[400px]">
                <div className="relative pt-4 text-center">

                    {/* Header: Icona e Nome */}
                    <div className="flex flex-col items-center justify-center gap-4 mb-6">
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl shadow-lg"
                            style={{ color: transaction.tag.colorHex }}
                        >
                            <FontAwesomeIcon icon={WALLET_ICONS[transaction.tag.icon as WalletIconKey] || WALLET_ICONS['tag']} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">{transaction.name}</h3>
                            <p className="text-sm text-white/50">{transaction.transactionDate}</p>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className={`text-4xl font-bold mb-8 ${isIncome ? 'text-[#00ff7f]' : 'text-[#ff4d4d]'}`}>
                        {isIncome ? '+' : '-'}{transaction.amount.toFixed(2)}
                    </div>

                    {/* Dettagli Extra */}
                    <div className="space-y-4 text-left bg-white/5 rounded-xl p-4 mb-6">
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-white/40 text-sm">Category</span>
                            <span className="text-white font-medium text-sm flex items-center gap-2">
                                <span style={{ color: transaction.tag.colorHex }}>{transaction.tag.name}</span>
                            </span>
                        </div>

                        {/* Mostra solo se ci sono dati sul cambio valuta */}
                        {transaction.originalCurrency && transaction.exchangeValue && transaction.exchangeValue !== 1 && (
                            <div className="flex justify-between border-b border-white/5 pb-3">
                                <span className="text-white/40 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faArrowRightArrowLeft} /> Original Amount
                                </span>
                                <span className="text-white font-medium text-sm">
                                    {transaction.originalAmount?.toFixed(2)} {transaction.originalCurrency} <span className="text-white/30 text-xs">(Rate: {transaction.exchangeValue})</span>
                                </span>
                            </div>
                        )}

                        {transaction.notes && (
                            <div className="flex flex-col gap-1">
                                <span className="text-white/40 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faStickyNote} /> Notes
                                </span>
                                <p className="text-white/80 text-sm italic p-2 bg-black/20 rounded-lg">
                                    "{transaction.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottoni Azione */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleEdit} className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 font-bold text-white transition-colors hover:bg-white/20">
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
                        </button>
                        <button onClick={handleDelete} className="flex items-center justify-center gap-2 rounded-xl bg-[#ff4d4d]/10 py-3 font-bold text-[#ff4d4d] transition-colors hover:bg-[#ff4d4d]/20">
                            <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                    </div>

                    <button onClick={() => dialogRef.current?.close()} className="absolute top-0 right-0 text-white/30 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>
            </ModalDialog>
        );
    }
);