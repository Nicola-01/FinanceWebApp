import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WalletsBar } from "./wallet/WalletsBar.tsx";
import { WalletDashboard } from "./wallet/WalletDashboard.tsx";
import api from '../api/axiosConfig';
import { triggerToast } from '../components/ToastNotification';
import type { Wallet } from "../utils/types";
import { useDeleteModal } from "../modals/DeleteModalContext.tsx";
import { AppHeader } from "../header/AppHeader.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPiggyBank } from "@fortawesome/free-solid-svg-icons";

const UserDashboard: React.FC = () => {
    const { walletId } = useParams<{ walletId: string }>();
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

            if (!walletId && fetchedWallets.length > 0) {
                let targetId = fetchedWallets[0].id;

                const savedOrderStr = localStorage.getItem('wallet_order');
                if (savedOrderStr) {
                    try {
                        const savedOrder = JSON.parse(savedOrderStr) as string[];

                        const firstValidSavedId = savedOrder.find(savedId =>
                            fetchedWallets.some(wallet => wallet.id === savedId)
                        );

                        if (firstValidSavedId)
                            targetId = firstValidSavedId;
                    } catch (e) {
                        console.error("Error parsing wallet_order from localStorage", e);
                    }
                }
                navigate(`/dashboard/${targetId}`, { replace: true });
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
            navigate(`/dashboard/${wallets[0].id}`, { replace: true });
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
        // 1. Mobile: min-h-screen (scorre tutto). Desktop: h-screen e overflow-hidden (layout fisso)
        <div className="flex flex-col min-h-screen xl:h-screen xl:overflow-hidden bg-app-bg text-app-text transition-colors">

            {/* L'Header occupa il suo spazio fisso in alto */}
            <AppHeader page={{ text: "My", accent: "Wallet" }} />

            {/* 2. Desktop: Nascondiamo gli overflow che sbordano dal layout flessibile */}
            <div className="flex flex-col xl:flex-row flex-1 xl:overflow-hidden">

                {/* La barra laterale prenderà xl:h-full e scorrerà da sola */}
                <WalletsBar
                    wallets={wallets}
                    setWallets={setWallets}
                    loading={loading}
                    selectedWalletId={walletId}
                    onSelectWallet={(id) => handleChangeWallet(id)}
                    onRefreshAll={fetchData}
                />

                {/* 3. Desktop: Permettiamo SOLO a quest'area destra di scorrere verticalmente */}
                <div className="flex-1 bg-app-bg xl:overflow-y-auto custom-scrollbar">
                    {selectedWallet ? (
                        <WalletDashboard
                            _wallet={selectedWallet}
                            key={selectedWallet.id}
                            onWalletUpdate={fetchData}
                            onWalletDelete={() => {
                                deleteModalRef.current?.deleteObject(
                                    selectedWallet, 'wallet',
                                    async () => await handleConfirmDelete(selectedWallet.id)
                                );
                            }}
                        />
                    ) : (
                        <div className="flex h-full min-h-[50vh] items-center justify-center text-app-muted">
                            {loading ? "Loading data..."
                                : (
                                    <div className="flex flex-col items-center justify-center py-24 text-app-muted">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-input">
                                            <FontAwesomeIcon icon={faPiggyBank} className="text-2xl opacity-50" />
                                        </div>
                                        <p className="text-sm font-bold">No wallets found.</p>
                                        <p className="mt-1 text-xs opacity-60 font-medium">Click "New Wallet" to add your first one.</p>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;