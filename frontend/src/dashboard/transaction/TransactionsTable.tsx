import React from 'react';
import type {Transaction, Wallet} from '../../utils/types.ts';
import TransactionRow from "./TransactionRow.tsx";
interface TransactionsTableProps {
    transactions: Transaction[];
    wallet: Wallet;
    onRefresh: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({transactions, wallet}) => {
    // const detailsModalRef = useRef<CreateTransactionModalHandle>(null);

    // Raggruppamento per Data
    const groupedTransactions = transactions.reduce((acc, tx) => {
        if (!acc[tx.transactionDate]) acc[tx.transactionDate] = [];
        acc[tx.transactionDate].push(tx);
        return acc;
    }, {} as Record<string, Transaction[]>);

    // TODO da risolvere
    wallet = wallet

    // Ordiniamo le date in ordine decrescente (le più recenti prima)
    const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Funzione per formattare la data (CORRETTA)
    const formatDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const formatedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        if (date.toDateString() === today.toDateString()) return `Today - ${formatedDate}`;
        if (date.toDateString() === yesterday.toDateString()) return `Yesterday - ${formatedDate}`;

        // CORREZIONE BUG: Ritorna formatedDate invece di niente!
        return formatedDate;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Lista Raggruppata */}
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/40">
                        <p>No transactions found for this period.</p>
                    </div>
                ) : (
                    sortedDates.map(date => (
                        <div key={date} className="mb-6">
                            <div className="mb-4 mt-2 flex items-center gap-4">
                                <div className="h-px w-8 bg-white/10 rounded-full"></div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 whitespace-nowrap">
                                    {formatDateHeader(date)}
                                </h4>
                                <div className="h-px flex-1 bg-white/10 rounded-full"></div>
                            </div>

                            {/* Transazioni di quel giorno */}
                            <div>
                                {groupedTransactions[date].map(tx => (
                                    //TODO
                                    <TransactionRow
                                        key={tx.id}
                                        // @ts-ignore
                                        transaction={tx} onClick={function (tx: Transaction): void {
                                        throw new Error("Function not implemented.");
                                    }}                                        // onClick={(tx) => detailsModalRef.current?.openModal()}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modale dei Dettagli */}
            {/*<CreateTransactionModal*/}
            {/*    ref={detailsModalRef}*/}
            {/*    walletId={wallet.id}*/}
            {/*    onSuccess={onRefresh} */}
            {/*    baseCurrency={wallet.currency}               */}
            {/*    onEdit={(tx) => {*/}
            {/*        console.log("Edit requested for", tx.name);*/}
            {/*    }}*/}
            {/*/>*/}
        </div>
    );
};