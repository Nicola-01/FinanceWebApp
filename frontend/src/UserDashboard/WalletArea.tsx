import React, {useEffect, useRef, useState} from 'react';
import api from '../api/axiosConfig';
import {faPlus} from '@fortawesome/free-solid-svg-icons';
import {triggerToast} from '../components/ToastNotification';
import type {Wallet} from '../utils/types.ts';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {CreateWalletModal, type CreateWalletModalHandle} from "../modals/CreateWalletModal.tsx";
import type {DeleteModalHandle} from "../modals/DeleteConfirmationModal.tsx";
import WalletCard from "./WalletCard.tsx";


interface WalletAreaProps {
    deleteModalRef: React.RefObject<DeleteModalHandle | null>;
}

export const WalletArea: React.FC<WalletAreaProps> = ({deleteModalRef}) => {
    const [wallets, setWallets] = useState<Wallet[]>([]);
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

    const handleConfirmDelete = async (walletsId: string) => {
        try {
            await api.delete(`/wallets/${walletsId}`);
            // Optimistic UI update: remove user from state without reloading
            setWallets(prev => prev.filter(w => w.id !== walletsId));
            triggerToast("Deleted!", true);
        } catch (err: any) {
            triggerToast(err.response?.data?.title || 'Error deleting.', false);
        }
    };

    useEffect(() => {
        fetchWallets();
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {/* Render existing wallets */}
            {wallets.map((wallet) => (
                <WalletCard
                    wallet={wallet}
                    onDelete={(walletToDelete: Wallet) => {
                        deleteModalRef.current?.deleteObject(
                            walletToDelete,
                            'wallet',
                            async () => await handleConfirmDelete(walletToDelete.id)
                        );
                    }}
                />
            ))}

            {/* "Trace Area" - Add New WalletCard Element */}
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