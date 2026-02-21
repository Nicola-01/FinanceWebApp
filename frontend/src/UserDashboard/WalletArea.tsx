import React, {useEffect, useRef, useState} from 'react';
import api from '../api/axiosConfig';
import Wallet from './Wallet';
import {faPlus, faWallet} from '@fortawesome/free-solid-svg-icons';
import {triggerToast} from '../components/ToastNotification';
import type {Wallet as WalletType} from '../utils/types.ts';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {CreateWalletModal, type CreateWalletModalHandle} from "../modals/CreateWalletModal.tsx";


export const WalletArea: React.FC = () => {
    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [loading, setLoading] = useState(true);
    const walletModal = useRef<CreateWalletModalHandle>(null);


    const fetchWallets = async () => {
        try {
            const response = await api.get('/wallets');
            setWallets(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.title || "Error loading wallets";
            triggerToast(errorMessage, false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {/* Render existing wallets */}
            {wallets.map((wallet) => (
                <Wallet
                    key={wallet.id}
                    title={wallet.name}
                    icon={faWallet}
                    color={wallet.color}
                />
            ))}

            {/* "Trace Area" - Add New Wallet Element */}
            <button
                onClick={walletModal.current?.openModal}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-dashed border-white/30 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/50 w-full text-left"
            >
                <div
                    className="flex justify-center items-center w-12 h-12 rounded-full bg-white/5 text-xl text-white/40 group-hover:text-[#00ff7f] transition-colors shrink-0">
                    <FontAwesomeIcon icon={faPlus}/>
                </div>
                <div className="flex flex-col min-w-0">
                    <h4 className="m-0 text-sm font-medium text-white/40 group-hover:text-white transition-colors truncate">
                        Add New Wallet
                    </h4>
                </div>
            </button>

            {/* Skeleton / Loading state (opzionale) */}
            {loading && wallets.length === 0 && (
                <div className="text-white/20 animate-pulse">Loading wallets...</div>
            )}
            <CreateWalletModal ref={walletModal} onSuccess={fetchWallets}/>
        </div>
    );
};