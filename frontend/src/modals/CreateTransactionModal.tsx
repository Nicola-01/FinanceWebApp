import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import './Modal.css'

interface Props {
    isOpen: boolean;
    walletId: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTransactionModal: React.FC<Props> = ({ isOpen, walletId, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('EXPENSE');
    const [tagName, setTagName] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !walletId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/transactions/${walletId}`, {
                name,
                amount: parseFloat(amount),
                type,
                tag: tagName, // Il backend si aspetta il nome del tag
                originalAmount: parseFloat(amount),
                originalCurrency: 'EUR'
            });
            onSuccess();
            onClose();
            setName(''); setAmount(''); setTagName('');
        } catch (error) {
            console.error("Error creating transaction", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="glass-card" style={{ width: '400px', maxWidth: '90%' }}>
                <div className="d-flex justify-content-between mb-4 border-bottom border-secondary pb-2">
                    <h3><FontAwesomeIcon icon={faExchangeAlt} /> New Transaction</h3>
                    <button className="btn text-white" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="text-white-50 small">Description</label>
                        <input className="form-control glass-input" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="row mb-3">
                        <div className="col-6">
                            <label className="text-white-50 small">Amount</label>
                            <input type="number" step="0.01" className="form-control glass-input" value={amount} onChange={e => setAmount(e.target.value)} required />
                        </div>
                        <div className="col-6">
                            <label className="text-white-50 small">Type</label>
                            <select className="form-select glass-input" value={type} onChange={e => setType(e.target.value)}>
                                <option value="EXPENSE">Expense (-)</option>
                                <option value="INCOME">Income (+)</option>
                            </select>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="text-white-50 small">Tag (Optional)</label>
                        <input className="form-control glass-input" placeholder="e.g. Food, Salary..." value={tagName} onChange={e => setTagName(e.target.value)} />
                    </div>
                    <div className="text-end">
                        <button type="submit" className="btn neon-btn" disabled={!name || !amount || loading}>
                            {loading ? 'Processing...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTransactionModal;