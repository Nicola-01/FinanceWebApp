import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {WalletsBar} from "./wallet/WalletsBar.tsx";
import {WalletDashboard} from "./wallet/WalletDashboard.tsx";
import api from '../api/axiosConfig';
import {triggerToast} from '../components/ToastNotification';
import type {Wallet} from "../utils/types";
import {useDeleteModal} from "../modals/DeleteModalContext.tsx";
import {AppHeader} from "../header/AppHeader.tsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPiggyBank} from "@fortawesome/free-solid-svg-icons";

const UserDashboard: React.FC = () => {
    const {walletId} = useParams<{ walletId: string }>();
    const navigate = useNavigate();

    // Centralized states
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Download all wallets and ALL their transactions concurrently
    const fetchData = async () => {
        try {
            setLoading(true);

            const wRes = await api.get('/wallets');
            const fetchedWallets: Wallet[] = wRes.data;
            setWallets(fetchedWallets);

            // Se non c'è un ID nell'URL, seleziona automaticamente il primo wallet
            if (!walletId && fetchedWallets.length > 0) {
                navigate(`/dashboard/${fetchedWallets[0].id}`, {replace: true});
            }
        } catch (err) {
            triggerToast("Error loading data", false);
        } finally {
            setLoading(false);
        }
    };

    // Execute on first load
    useEffect(() => {
        fetchData();
    }, []);

    // Deletion handling: se il wallet selezionato sparisce, naviga al primo disponibile
    useEffect(() => {
        if (!loading && wallets.length > 0 && walletId && !wallets.find(w => w.id === walletId)) {
            navigate(`/dashboard/${wallets[0].id}`, {replace: true});
        }
    }, [walletId, wallets, loading, navigate]);

    const selectedWallet = wallets.find(w => w.id === walletId) || null;

    const deleteModalRef = useDeleteModal();

    const handleConfirmDelete = async (idToDelete: string) => {
        try {
            await api.delete(`/wallets/${idToDelete}`);
            setWallets(prev => prev.filter(w => w.id !== idToDelete));
            triggerToast("Deleted!", true);
        } catch (err: any) {
            triggerToast(err.response?.data?.title || "Error deleting.", false);
        }
    };

    function handleChangeWallet(id: string) {
        navigate(`/dashboard/${id}`);
    }

    return (
        <>
            <AppHeader page={{text: "My", accent: "Wallet"}}/>
            <div className="flex flex-col xl:flex-row min-h-screen bg-[#0d0d12] text-white overflow-hidden">

                <WalletsBar
                    wallets={wallets}
                    setWallets={setWallets}
                    loading={loading}
                    selectedWalletId={walletId}
                    onSelectWallet={(id) => handleChangeWallet(id)}
                    onRefreshAll={fetchData}
                />

                <div className="flex-1 overflow-y-auto h-screen bg-[#0d0d12]">
                    {selectedWallet ? (
                        <WalletDashboard
                            _wallet={selectedWallet}
                            key={selectedWallet.id}
                            onWalletDelete={() => {
                                deleteModalRef.current?.deleteObject(
                                    selectedWallet, 'wallet',
                                    async () => await handleConfirmDelete(selectedWallet.id)
                                );
                            }}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-white/40">
                            {loading ? "Loading data..."
                                : (
                                    <div className="flex flex-col items-center justify-center py-24 text-white/40">
                                        <div
                                            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                                            <FontAwesomeIcon icon={faPiggyBank} className="text-2xl opacity-50"/>
                                        </div>
                                        <p className="text-sm font-medium">No wallets found.</p>
                                        <p className="mt-1 text-xs opacity-60">Click "New Wallet" to add your first
                                            one.</p>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserDashboard;