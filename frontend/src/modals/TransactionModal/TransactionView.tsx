import React from 'react';
import api from '../../api/axiosConfig';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faCalendarAlt,
    faEdit,
    faExchangeAlt,
    // faRepeat,
    faStickyNote,
    faTag,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import {triggerToast} from '../../components/ToastNotification';
import type {Transaction, Wallet} from "../../utils/types.ts";
import {type IconKey, ICONS} from "../../utils/icons.ts";
import {CURRENCY_META, type CurrencyCode} from '../../utils/currencies';

interface TransactionViewProps {
    tx: Transaction;
    wallet: Wallet
    onClose: () => void;
    onEdit: () => void;
    onDeleteSuccess: () => void;
}

export const TransactionView: React.FC<TransactionViewProps> = ({
                                                                    tx,
                                                                    wallet,
                                                                    onClose,
                                                                    onEdit,
                                                                    onDeleteSuccess
                                                                }) => {

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;

        try {
            await api.delete(`/transactions/${wallet.id}/${tx.id}`);
            triggerToast("Transaction deleted", true);
            onDeleteSuccess();
        } catch (err) {
            triggerToast("Error deleting transaction", false);
        }
    };

    const isIncome = tx.type === 'INCOME';

    console.log(tx)

    return (
        <div className="text-center flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex w-full justify-end -mb-6">
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                    Close
                </button>
            </div>

            {/* Header: Icona grande e testo del TAG sotto */}
            <div className="flex flex-col items-center gap-3">
                <div
                    className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-4xl shadow-lg border border-white/10"
                    style={{color: tx.tag.colorHex}}>
                    <FontAwesomeIcon icon={ICONS[tx.tag.icon as IconKey] || faTag}/>
                </div>
                <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider" style={{
                    backgroundColor: `${tx.tag.colorHex}20`,
                    color: tx.tag.colorHex,
                    border: `1px solid ${tx.tag.colorHex}40`
                }}>
                    {tx.tag.name}
                </span>
            </div>

            {/* Solo Importo */}
            <div>
                <p className={`text-4xl font-app-mono font-bold ${isIncome ? 'text-[#00ff7f]' : 'text-[#ff4d4d]'}`}>
                    {isIncome ? '+' : '-'}{tx.amount.toFixed(2)} {wallet.currency}
                </p>
            </div>

            {/* Griglia Dettagli */}
            <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-left flex flex-col gap-2">

                <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider"><FontAwesomeIcon
                        icon={faTag} className="mr-2"/>Name</span>
                    <span className="text-white font-medium text-right">{tx.name}</span>
                </div>

                <hr className="my-2 border-white/10"/>

                <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider"><FontAwesomeIcon
                        icon={faCalendarAlt} className="mr-2"/>Date</span>
                    <span className="text-white font-medium">{new Date(tx.transactionDate).toLocaleDateString()}</span>
                </div>

                {/* Nuova Sezione Cambio Valuta Integrata */}
                {(tx as any).originalCurrency && (tx as any).originalCurrency !== wallet.currency && (
                    <>
                        <hr className="my-2 border-white/10"/>
                        <div className="flex flex-col gap-3">
                            <span className="text-[#00bfff]/70 text-xs font-bold uppercase tracking-wider">
                                <FontAwesomeIcon icon={faExchangeAlt} className="mr-2"/>
                                Currency Exchange
                            </span>

                            <div className="flex items-center justify-between rounded-xl bg-[#00bfff]/5 p-4 border border-[#00bfff]/20">
                                {/* Importo Originale */}
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold font-app-mono text-white">
                                        {(tx as any).originalAmount?.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-[#00bfff]/70 font-bold uppercase tracking-wider">
                                        {CURRENCY_META[(tx as any).originalCurrency as CurrencyCode]?.symbol || (tx as any).originalCurrency}
                                    </span>
                                </div>

                                {/* Freccia e Tasso di Cambio */}
                                <div className="flex flex-col items-center justify-center flex-1 px-4">
                                    <span className="text-[10px] font-bold text-[#00bfff]/70 mb-1 whitespace-nowrap">
                                        1 {(tx as any).originalCurrency} = {(tx as any).exchangeValue} {wallet.currency}
                                    </span>
                                    <div className="flex w-full items-center">
                                        <div className="h-[1px] flex-1 bg-[#00bfff]/30"></div>
                                        <FontAwesomeIcon icon={faArrowRight} className="text-[#00bfff]/50 px-2 text-xs" />
                                        <div className="h-[1px] flex-1 bg-[#00bfff]/30"></div>
                                    </div>
                                </div>

                                {/* Importo Convertito */}
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold font-app-mono text-[#00bfff]">
                                        {tx.amount.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-[#00bfff]/70 font-bold uppercase tracking-wider">
                                        {CURRENCY_META[wallet.currency as CurrencyCode]?.symbol || wallet.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {tx.notes && (
                    <>
                        <hr className="my-2 border-white/10"/>
                        <div className="flex flex-col gap-2">
                            <span className="text-white/40 text-xs font-bold uppercase tracking-wider"><FontAwesomeIcon
                                icon={faStickyNote} className="mr-2"/>Notes</span>
                            <span
                                className="text-white/80 text-sm bg-white/5 p-3 rounded-lg border border-white/5">{tx.notes}</span>
                        </div>
                    </>
                )}

                {/*{(tx as any).isRecurring && (*/}
                {/* <div className="flex items-center gap-2 text-[#00bfff] text-sm font-bold pt-1">*/}
                {/* <FontAwesomeIcon icon={faRepeat}/> This is a recurring transaction*/}
                {/* </div>*/}
                {/*)}*/}
            </div>

            {/* Bottoni Azione */}
            <div className="flex w-full gap-4 mt-2">
                <button onClick={handleDelete}
                        className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 py-4 font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <FontAwesomeIcon icon={faTrash} className="mr-2"/> Delete
                </button>
                <button onClick={onEdit}
                        className="flex-1 rounded-xl py-4 font-bold text-black transition-all hover:-translate-y-1"
                        style={{backgroundColor: wallet.color, boxShadow: `0 5px 15px -5px ${wallet.color}66`}}>
                    <FontAwesomeIcon icon={faEdit} className="mr-2"/> Edit Details
                </button>
            </div>
        </div>
    );
};