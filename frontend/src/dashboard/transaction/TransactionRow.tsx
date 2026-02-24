import React from "react";
import type { Transaction } from "../../utils/types.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ICONS, type IconKey } from "../../utils/icons.ts";
import { faTags } from "@fortawesome/free-solid-svg-icons";

interface TransactionRowProps {
    transaction: Transaction;
    onClick: (tx: Transaction) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onClick }) => {
    const isIncome = transaction.type === 'INCOME';

    return (
        <div
            onClick={() => onClick(transaction)}
            className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl mb-2 cursor-pointer transition-all hover:bg-white/10 hover:-translate-y-0.5"
        >
            <div className="flex items-center gap-4 min-w-0">
                {/* Icona */}
                <div
                    className="flex shrink-0 h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl shadow-sm"
                    style={{ color: transaction.tag.colorHex }}
                >
                    <FontAwesomeIcon icon={ICONS[transaction.tag.icon as IconKey] || faTags} />
                </div>

                {/* Dettagli (Responsivi: Tag a fianco su Desktop, sotto su Mobile) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                    <span className="text-base font-bold text-white truncate">{transaction.name}</span>
                    <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-max"
                        style={{
                            backgroundColor: `${transaction.tag.colorHex}15`,
                            color: transaction.tag.colorHex,
                            border: `1px solid ${transaction.tag.colorHex}30`
                        }}
                    >
                        {transaction.tag.name}
                    </span>
                </div>
            </div>

            {/* Cifra */}
            <div className={`shrink-0 pl-4 text-right text-lg font-bold font-mono ${isIncome ? 'text-[#00ff7f]' : 'text-[#ff4d4d]'}`}>
                {isIncome ? '+' : '-'}{transaction.amount.toFixed(2)}
            </div>
        </div>
    );
};

export default TransactionRow;