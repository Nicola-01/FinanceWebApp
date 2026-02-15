import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faWallet, faCheck, faPalette } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import './Modal.css'

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateWalletModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('EUR');
    const [color, setColor] = useState('#00ff7f');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/wallets', { name, currency, color, icon: 'wallet' });
            onSuccess();
            onClose();
            setName('');
        } catch (error) {
            console.error("Error creating wallet", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="glass-card" style={{ width: '400px', maxWidth: '90%' }}>
                <div className="d-flex justify-content-between mb-4 border-bottom border-secondary pb-2">
                    <h3><FontAwesomeIcon icon={faWallet} /> New Wallet</h3>
                    <button className="btn text-white" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="text-white-50 small">Wallet Name</label>
                        <input className="form-control glass-input" value={name} onChange={e => setName(e.target.value)} autoFocus required />
                    </div>
                    <div className="row mb-4">
                        <div className="col-6">
                            <label className="text-white-50 small">Currency</label>
                            <select className="form-select glass-input" value={currency} onChange={e => setCurrency(e.target.value)}>
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                        <div className="col-6">
                            <label className="text-white-50 small">Color</label>
                            <div className="d-flex align-items-center">
                                <input type="color" className="form-control form-control-color glass-input w-100" value={color} onChange={e => setColor(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="text-end">
                        <button type="submit" className="btn neon-btn" disabled={!name || loading}>
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWalletModal;