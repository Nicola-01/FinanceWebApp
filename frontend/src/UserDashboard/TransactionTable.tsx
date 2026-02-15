import React from 'react';
import type { Transaction } from '../types';
import './TransactionTable.css'

interface Props {
    transactions: Transaction[];
    currency: string;
}

const TransactionTable: React.FC<Props> = ({ transactions, currency }) => {
    return (
        <div className="glass-card p-0 overflow-hidden">
            <div className="table-responsive">
                <table className="table table-dark table-transparent mb-0 align-middle" style={{ background: 'transparent' }}>
                    <thead className="table-header-glass">
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th className="ps-4 py-3 text-secondary text-uppercase small">Date</th>
                        <th className="py-3 text-secondary text-uppercase small">Tag</th>
                        <th className="py-3 text-secondary text-uppercase small">Note</th>
                        <th className="pe-4 py-3 text-end text-secondary text-uppercase small">Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    {transactions.length > 0 ? (
                        transactions.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="table-row-glass">
                                <td className="ps-4 text-white-50">{tx.transactionDate}</td>
                                <td>
                                    {tx.tag ? (
                                        <span className="badge rounded-pill fw-normal"
                                              style={{ backgroundColor: `${tx.tag.colorHex}33`, color: 'white', border: `1px solid ${tx.tag.colorHex}` }}>
                                                {tx.tag.name}
                                            </span>
                                    ) : <span className="text-muted small">No Tag</span>}
                                </td>
                                <td>{tx.notes || '-'}</td>
                                <td className={`pe-4 text-end fw-bold ${tx.type === 'INCOME' ? 'text-success' : 'text-danger'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'} {Math.abs(tx.amount).toFixed(2)} {currency}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={4} className="text-center py-5 text-muted">No transactions found.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionTable;