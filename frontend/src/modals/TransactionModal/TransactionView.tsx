import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faStickyNote,
    faTag
} from '@fortawesome/free-solid-svg-icons';
import type { Transaction, Wallet } from "../../utils/types.ts";
import { CURRENCY_META, type CurrencyCode } from '../../utils/currencies';
import { ExchangeRateSection } from './ExchangeRateSection.tsx';
import { TagBadge } from "../../components/ui/TagBadge.tsx";

interface TransactionViewProps {
    tx: Transaction;
    wallet: Wallet;
}

export const TransactionView: React.FC<TransactionViewProps> = ({
                                                                    tx,
                                                                    wallet
                                                                }) => {
    const isIncome = tx.type === 'INCOME';

    const displayExchangeRate = (tx as any).exchangeValue
        ? Number((tx as any).exchangeValue).toFixed(6).replace(/\.?0+$/, '')
        : '1';

    const date = new Date(tx.transactionDate);
    const formatedDate = date.toLocaleDateString('en-UK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="flex flex-col items-center gap-6 animate-[fadeIn_0.2s_ease-out]">
            {/* 1. IMPORTO (Invariato) */}
            <div className="text-center mt-2">
                <p className={`text-6xl font-app-mono ${isIncome ? 'text-app-green' : 'text-app-red'}`}>
                    {isIncome ? '+' : '-'}{tx.amount.toFixed(2)} <span
                    className="text-3xl">{CURRENCY_META[wallet.currency as CurrencyCode]?.symbol}</span>
                </p>
            </div>

            {/* --- NUOVA SEZIONE CATEGORIA --- */}
            {/* Posizionata FUORI dall'elenco "divide-y" per darle maggiore rilievo visivo, centrandola. */}
            <div className="flex items-center gap-2 -mt-2">
                <TagBadge tag={tx.tag} forceShowParent={true} />
            </div>

            {/* 2. DETTAGLI: Uso divide-y per le righe automatiche, rimosso il padding generale.
               Questa box ora contiene solo dettagli tecnici, SENZA la Categoria. */}
            <div className="w-full bg-app-input border border-app-border rounded-2xl text-left flex flex-col divide-y divide-app-border">

                {/* Nome */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5">
                    <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center shrink-0">
                        {/* W-5 text-center assicura che il testo sia perfettamente allineato indipendentemente dalla larghezza dell'icona. */}
                        <FontAwesomeIcon icon={faTag} className="w-5 text-center mr-2" />Name
                    </span>
                    <span className="text-app-text font-medium sm:text-right truncate">{tx.name}</span>
                </div>

                {/* Data */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-5">
                    <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center shrink-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="w-5 text-center mr-2" />Date
                    </span>
                    <span className="text-app-text font-medium">{formatedDate}</span>
                </div>

                {/* Note (Mostrate solo se presenti) */}
                {tx.notes && (
                    <div className="flex flex-col gap-3 p-5">
                        <span className="text-app-muted text-xs font-bold uppercase tracking-wider flex items-center">
                            <FontAwesomeIcon icon={faStickyNote} className="w-5 text-center mr-2" />Notes
                        </span>
                        <span className="text-app-text text-sm bg-app-input p-3 rounded-lg border border-app-border">
                            {tx.notes}
                        </span>
                    </div>
                )}

                {/* Box Cambio Valuta (Integrato nell'elenco) */}
                {(tx as any).originalCurrency && (tx as any).originalCurrency !== wallet.currency && (
                    <div className="p-4 sm:p-5">
                        <ExchangeRateSection
                            mode="view"
                            baseCurrency={wallet.currency as CurrencyCode}
                            selectedCurrency={(tx as any).originalCurrency as CurrencyCode}
                            originalAmount={(tx as any).originalAmount || 0}
                            exchangeRate={displayExchangeRate}
                            convertedAmount={tx.amount}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};