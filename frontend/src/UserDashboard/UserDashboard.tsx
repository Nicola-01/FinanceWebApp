import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faWallet, faPlus } from '@fortawesome/free-solid-svg-icons';
import api from '../api/axiosConfig';
import Sphere from '../assets/Sphere';
import WalletGrid from './WalletGrid';
import TransactionTable from './TransactionTable';
import CreateWalletModal from '../modals/CreateWalletModal';
import CreateTransactionModal from '../modals/CreateTransactionModal';
import type { Wallet, Transaction } from '../types';
import './UserDashboard.css'; // Importa il CSS condiviso

const UserDashboard: React.FC = () => {
    // --- STATE ---
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Modals
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);

    // Config
    const [maxSpheres, setMaxSpheres] = useState(5);

    // --- INIT ---
    useEffect(() => {
        loadWallets();
        const handleResize = () => setMaxSpheres(window.innerWidth < 768 ? 3 : 8);
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedWallet) loadTransactions(selectedWallet.id);
        else setTransactions([]);
    }, [selectedWallet]);

    // --- API ---
    const loadWallets = async () => {
        try {
            const res = await api.get('/wallets');
            // Mock balance
            const enriched = res.data.map((w: Wallet) => ({
                ...w, virtualBalance: Math.floor(Math.random() * 5000) + 500
            }));
            setWallets(enriched);
        } catch (e) { console.error(e); }
    };

    const loadTransactions = async (id: string) => {
        try {
            const res = await api.get(`/transactions/${id}`);
            setTransactions(res.data);
        } catch (e) { console.error(e); }
    };

    // --- SPHERE LOGIC ---
    const sphereData = useMemo(() => {
        if (!selectedWallet) {
            // SFERE WALLET
            return wallets.map((w, i) => ({
                id: w.id, color: w.color,
                size: Math.max(100, Math.min(300, (w.virtualBalance || 0) / 10)),
                x: (i % 2 === 0 ? -1 : 1) * (i * 30 + 20), y: (i % 3 === 0 ? -1 : 1) * (i * 20),
                delay: i
            })).slice(0, maxSpheres);
        } else {
            // SFERE TAG
            const tagMap = new Map();
            transactions.forEach(tx => {
                if(tx.tag) {
                    const curr = tagMap.get(tx.tag.name) || { amt: 0, col: tx.tag.colorHex };
                    curr.amt += Math.abs(tx.amount);
                    tagMap.set(tx.tag.name, curr);
                }
            });
            return Array.from(tagMap.entries())
                .sort((a, b) => b[1].amt - a[1].amt)
                .slice(0, maxSpheres)
                .map(([name, d], i) => ({
                    id: name, color: d.col, size: Math.max(80, Math.min(250, d.amt / 5)),
                    x: (i % 2 === 0 ? 50 : -50) * i, y: (i % 3 === 0 ? 30 : -30) * i,
                    delay: i
                }));
        }
    }, [wallets, selectedWallet, transactions, maxSpheres]);

    return (
        <div className="dashboard-container">
            {/* BACKGROUND */}
            <div className="spheres-layer">
                {sphereData.map(s => (
                    <Sphere key={s.id}
                            style={{ width: s.size, height: s.size, background: s.color, opacity: 0.3, position: 'absolute', top: `calc(50% + ${s.y}px)`, left: `calc(50% + ${s.x}px)`, filter: 'blur(40px)' }}
                            animate={{ y: [0, 20, -20, 0], x: [0, 15, -15, 0] }} transition={{ duration: 10 + s.delay, repeat: Infinity, repeatType: "reverse" }}
                    />
                ))}
            </div>

            {/* MODALS */}
            <CreateWalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} onSuccess={loadWallets} />
            <CreateTransactionModal isOpen={showTxModal} walletId={selectedWallet?.id || null} onClose={() => setShowTxModal(false)} onSuccess={() => selectedWallet && loadTransactions(selectedWallet.id)} />

            {/* CONTENT */}
            <div className="container-fluid position-relative" style={{ zIndex: 1 }}>

                {/* HEADER */}
                <div className="d-flex align-items-center justify-content-between p-4">
                    {selectedWallet ? (
                        <button className="btn btn-outline-light rounded-pill px-4" onClick={() => setSelectedWallet(null)}>
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Back
                        </button>
                    ) : <h2 className="text-white fw-bold">My Wallets</h2>}
                </div>

                {/* VIEW SWITCHER */}
                {!selectedWallet ? (
                    <WalletGrid wallets={wallets} onSelect={setSelectedWallet} onAddClick={() => setShowWalletModal(true)} />
                ) : (
                    <div className="px-3 fade-in">
                        {/* WALLET HEADER INFO */}
                        <div className="glass-card p-4 mb-4 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded p-3" style={{ background: selectedWallet.color }}>
                                    <FontAwesomeIcon icon={faWallet} size="2x" className="text-white" />
                                </div>
                                <div>
                                    <h1 className="m-0 text-white">{selectedWallet.name}</h1>
                                    <span className="text-white-50">Balance: € {selectedWallet.virtualBalance?.toLocaleString()}</span>
                                </div>
                            </div>
                            <button className="btn neon-btn btn-lg" onClick={() => setShowTxModal(true)}>
                                <FontAwesomeIcon icon={faPlus} className="me-2" /> New Transaction
                            </button>
                        </div>

                        <TransactionTable transactions={transactions} currency={selectedWallet.currency} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;