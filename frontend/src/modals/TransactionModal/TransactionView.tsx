import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {
    faArrowRight,
    faCalendarAlt,
    faEdit,
    faEllipsisV, // <-- Aggiunta icona 3 puntini
    faExchangeAlt,
    faStickyNote,
    faTag,
    faTimes,
    faTrash // <-- Reinserita icona per eliminare
} from '@fortawesome/free-solid-svg-icons';
import type {Transaction, Wallet} from "../../utils/types.ts";
import {type IconKey, ICONS} from "../../utils/icons.ts";
import {CURRENCY_META, type CurrencyCode} from '../../utils/currencies';
import {useDeleteModal} from "../DeleteModalContext.tsx";

interface TransactionViewProps {
    tx: Transaction;
    wallet: Wallet;
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
    // Stato per il menu a tendina
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const deleteModalRef = useDeleteModal();

    const isIncome = tx.type === 'INCOME';

    // Formattazione precisa per il tasso di cambio
    const displayExchangeRate = (tx as any).exchangeValue
        ? Number((tx as any).exchangeValue).toFixed(6).replace(/\.?0+$/, '')
        : '1';

    // Funzione di eliminazione reinserita
    const handleDelete = async () => {
        setIsMenuOpen(false);
        deleteModalRef.current?.deleteObject(
            tx,
            'transaction',
            async () => onDeleteSuccess(),
            false,
            0
        );
    };


    return (
        <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">

            {/* Header (Barra superiore) */}
            <div className="flex w-full items-center justify-between -mb-2">
                {/* Tasto Chiudi */}
                <button
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <FontAwesomeIcon icon={faTimes} className="text-xl"/>
                </button>

                {/* Tasto 3 Puntini (Opzioni) */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isMenuOpen ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
                    >
                        <FontAwesomeIcon icon={faEllipsisV} className="text-lg"/>
                    </button>

                    {/* Menu a tendina fluttuante */}
                    {isMenuOpen && (
                        <>
                            {/* Overlay invisibile per chiudere cliccando fuori */}
                            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}/>

                            <div
                                className="absolute right-0 top-full mt-2 z-50 flex w-40 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] shadow-2xl animate-[fadeIn_0.2s_ease-out]">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onEdit();
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white text-left"
                                >
                                    <FontAwesomeIcon icon={faEdit} className="w-4"/> Edit
                                </button>

                                <div className="h-[1px] w-full bg-white/5"/>

                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 text-left"
                                >
                                    <FontAwesomeIcon icon={faTrash} className="w-4"/> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Importo in primo piano */}
            <div className="text-center mt-2">
                <p className={`text-6xl font-app-mono ${isIncome ? 'text-[#00ff7f]' : 'text-[#ff4d4d]'}`}>
                    {isIncome ? '+' : '-'}{tx.amount.toFixed(2)} <span
                    className="text-3xl">{CURRENCY_META[wallet.currency as CurrencyCode]?.symbol}</span>
                </p>
            </div>

            {/* Griglia Dettagli */}
            <div className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-left flex flex-col gap-2">

                {/* 1. Categoria */}
                <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                        <FontAwesomeIcon icon={faTag} className="mr-2"/>Category
                    </span>
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider"
                        style={{
                            backgroundColor: `${tx.tag.colorHex}20`,
                            color: tx.tag.colorHex,
                            border: `1px solid ${tx.tag.colorHex}40`
                        }}
                    >
                        <FontAwesomeIcon icon={ICONS[tx.tag.icon as IconKey] || faTag}/>
                        {tx.tag.name}
                    </div>
                </div>

                <hr className="my-2 border-white/10"/>

                {/* 2. Nome */}
                <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                        <FontAwesomeIcon icon={faTag} className="mr-2"/>Name
                    </span>
                    <span className="text-white font-medium text-right">{tx.name}</span>
                </div>

                <hr className="my-2 border-white/10"/>

                {/* 3. Data */}
                <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2"/>Date
                    </span>
                    <span className="text-white font-medium">{new Date(tx.transactionDate).toLocaleDateString()}</span>
                </div>

                {/* 4. Note */}
                {tx.notes && (
                    <>
                        <hr className="my-2 border-white/10"/>
                        <div className="flex flex-col gap-2">
                            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">
                                <FontAwesomeIcon icon={faStickyNote} className="mr-2"/>Notes
                            </span>
                            <span className="text-white/80 text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                                {tx.notes}
                            </span>
                        </div>
                    </>
                )}

                {/* 5. Box Cambio Valuta */}
                {(tx as any).originalCurrency && (tx as any).originalCurrency !== wallet.currency && (
                    <>
                        <hr className="my-2 border-white/10"/>
                        <div className="flex flex-col gap-3">
                            <span className="text-[#00bfff]/70 text-xs font-bold uppercase tracking-wider">
                                <FontAwesomeIcon icon={faExchangeAlt} className="mr-2"/>
                                Currency Exchange
                            </span>

                            <div
                                className="flex items-center justify-between rounded-xl bg-[#00bfff]/5 p-4 border border-[#00bfff]/20">
                                {/* Importo Originale */}
                                <div className="flex flex-col items-center flex-1">
                                    <span className="text-base font-bold font-app-mono text-white whitespace-nowrap">
                                        {(tx as any).originalAmount?.toFixed(2)} {CURRENCY_META[(tx as any).originalCurrency as CurrencyCode]?.symbol || (tx as any).originalCurrency}
                                    </span>
                                </div>

                                {/* Freccia e Tasso di Cambio */}
                                <div className="flex flex-col items-center justify-center flex-[1.5] px-2">
                                    <span className="text-[10px] font-bold text-[#00bfff]/70 mb-1 whitespace-nowrap">
                                        1 {(tx as any).originalCurrency} = {displayExchangeRate} {wallet.currency}
                                    </span>
                                    <div className="flex w-full items-center">
                                        <div className="h-[1px] flex-1 bg-[#00bfff]/30"></div>
                                        <FontAwesomeIcon icon={faArrowRight}
                                                         className="text-[#00bfff]/50 px-2 text-xs"/>
                                        <div className="h-[1px] flex-1 bg-[#00bfff]/30"></div>
                                    </div>
                                </div>

                                {/* Importo Convertito */}
                                <div className="flex flex-col items-center flex-1">
                                    <span
                                        className="text-base font-bold font-app-mono text-[#00bfff] whitespace-nowrap">
                                        {tx.amount.toFixed(2)} {CURRENCY_META[wallet.currency as CurrencyCode]?.symbol || wallet.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};