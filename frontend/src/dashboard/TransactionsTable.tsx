import React from 'react';
import type {Transaction} from '../utils/types';

interface TransactionsTableProps {
    transactions: Transaction[];
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
    return (
        <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="sticky top-0 bg-[#141414]/90 backdrop-blur-md border-b border-white/10">
                <tr>
                    <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40">Date</th>
                    <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40">Name</th>
                    <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40">Tag</th>
                    <th className="p-4 text-xs font-medium uppercase tracking-wider text-white/40 text-right">Amount</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:bg-white/5 group">
                        <td className="p-4 text-sm text-white/60 font-mono">{tx.transactionDate}</td>
                        <td className="p-4 text-sm font-semibold text-white">{tx.name}</td>
                        <td className="p-4">
                            <span
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold"
                                style={{
                                    backgroundColor: `${tx.tag.colorHex}15`,
                                    color: tx.tag.colorHex,
                                    border: `1px solid ${tx.tag.colorHex}30`
                                }}
                            >
                                <span>{tx.tag.icon}</span> {tx.tag.name}
                            </span>
                        </td>
                        <td className={`p-4 text-right text-sm font-bold font-mono ${tx.type === 'INCOME' ? 'text-[#00ff7f]' : 'text-white'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toFixed(2)}
                        </td>
                    </tr>
                ))}
                {transactions.length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-white/40">No transactions found for this period/filter.</td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
};
