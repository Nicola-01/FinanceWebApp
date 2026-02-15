import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { Wallet } from '../types';
import './WalletGrid.css'

interface Props {
    wallets: Wallet[];
    onSelect: (wallet: Wallet) => void;
    onAddClick: () => void;
}

const WalletGrid: React.FC<Props> = ({ wallets, onSelect, onAddClick }) => {
    return (
        <div className="row g-4 px-3">
            {wallets.map(wallet => (
                <div key={wallet.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div
                        className="glass-card h-100 d-flex flex-column wallet-hover"
                        onClick={() => onSelect(wallet)}
                        style={{ borderLeft: `5px solid ${wallet.color}`, cursor: 'pointer' }}
                    >
                        <div className="d-flex justify-content-between mb-3">
                            <div className="p-2 rounded" style={{ background: `${wallet.color}44` }}>
                                <FontAwesomeIcon icon={faWallet} style={{ color: wallet.color, fontSize: '1.2rem' }} />
                            </div>
                            <span className="badge bg-dark border border-secondary">{wallet.currency}</span>
                        </div>
                        <h4 className="mb-1">{wallet.name}</h4>
                        <p className="text-white-50 small mb-3">{wallet.myRole}</p>
                        <h3 className="fw-bold mt-auto">€ {wallet.virtualBalance?.toLocaleString()}</h3>
                    </div>
                </div>
            ))}

            {/* ADD CARD */}
            <div className="col-12 col-md-6 col-lg-4 col-xl-3">
                <div
                    className="glass-card h-100 d-flex flex-column justify-content-center align-items-center"
                    onClick={onAddClick}
                    style={{ border: '2px dashed rgba(255,255,255,0.2)', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
                >
                    <div className="rounded-circle bg-dark d-flex align-items-center justify-content-center mb-3" style={{width: 50, height: 50}}>
                        <FontAwesomeIcon icon={faPlus} className="text-white" />
                    </div>
                    <h5 className="text-muted">Create Wallet</h5>
                </div>
            </div>
        </div>
    );
};

export default WalletGrid;