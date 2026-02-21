import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AccountSettings } from "../components/AccountSettings.tsx";
import { WalletsArea } from "./WalletsArea.tsx";
import { WalletDashboard } from "./WalletDashboard.tsx";
import api from '../api/axiosConfig';
import { triggerToast } from '../components/ToastNotification';
import type { DeleteModalHandle } from "../modals/DeleteConfirmationModal.tsx";
import type { Wallet, Transaction } from "../utils/types"; // Controlla i tuoi percorsi

interface UserDashboardProps {
    deleteModalRef: React.RefObject<DeleteModalHandle | null>;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ deleteModalRef }) => {
    const { walletId } = useParams<{ walletId: string }>();
    const navigate = useNavigate();

    // Stati centralizzati
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [transactionsMap, setTransactionsMap] = useState<Record<string, Transaction[]>>({});
    const [loading, setLoading] = useState(true);
    const [isRefreshingTx, setIsRefreshingTx] = useState(false);

    // 1. Scarica tutti i wallet e TUTTE le loro transazioni in contemporanea
    const fetchData = async () => {
        try {
            setLoading(true);

            const wRes = await api.get('/wallets');
            const fetchedWallets: Wallet[] = wRes.data;
            setWallets(fetchedWallets);

            const txMap: Record<string, Transaction[]> = {};

            // Esegue tutte le chiamate /transactions/{id} in parallelo!
            await Promise.all(fetchedWallets.map(async (w) => {
                try {
                    const txRes = await api.get(`/transactions/${w.id}`);
                    txMap[w.id] = txRes.data;
                } catch (e) {
                    console.error(`Errore caricamento tx per wallet ${w.id}`);
                    txMap[w.id] = [];
                }
            }));

            setTransactionsMap(txMap);

            // Auto-selezione: Se non c'è un ID nell'URL, seleziona il primo wallet automaticamente
            if (!walletId && fetchedWallets.length > 0) {
                navigate(`/dashboard/${fetchedWallets[0].id}`, { replace: true });
            }
        } catch (err) {
            triggerToast("Error loading data", false);
        } finally {
            setLoading(false);
        }
    };

    // 2. Funzione per il nuovo tastino "Refresh" del singolo wallet
    const refreshSingleWallet = async (id: string) => {
        setIsRefreshingTx(true);
        try {
            const txRes = await api.get(`/transactions/${id}`);
            setTransactionsMap(prev => ({ ...prev, [id]: txRes.data }));
            triggerToast("Transactions updated!", true);
        } catch (err) {
            triggerToast("Error refreshing transactions", false);
        } finally {
            setIsRefreshingTx(false);
        }
    };

    // Esegui al primo caricamento (F5)
    useEffect(() => {
        fetchData();
    }, []);

    // Gestione eliminazione: se elimino il wallet attualmente aperto, navigo al primo disponibile
    useEffect(() => {
        if (!loading && wallets.length > 0 && walletId && !wallets.find(w => w.id === walletId)) {
            navigate(`/dashboard/${wallets[0].id}`, { replace: true });
        }
    }, [walletId, wallets, loading, navigate]);

    // Dati calcolati per il rendering
    const selectedWallet = wallets.find(w => w.id === walletId) || null;
    const currentTransactions = walletId ? transactionsMap[walletId] || [] : [];

    return (
        <div className="flex flex-col xl:flex-row min-h-screen bg-gray-900 text-white overflow-hidden">
            <AccountSettings />

            {/* Passiamo i dati anziché farli scaricare a lui */}
            <WalletsArea
                deleteModalRef={deleteModalRef}
                wallets={wallets}
                setWallets={setWallets}
                loading={loading}
                selectedWalletId={walletId}
                onSelectWallet={(id) => navigate(`/dashboard/${id}`)}
                onRefreshAll={fetchData}
            />

            <div className="flex-1 overflow-y-auto h-screen bg-[#0d0d12]">
                {selectedWallet ? (
                    <WalletDashboard
                        wallet={selectedWallet}
                        transactions={currentTransactions}
                        onRefresh={() => refreshSingleWallet(selectedWallet.id)}
                        isRefreshing={isRefreshingTx}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-white/40">
                        {loading ? "Loading data..." : "No wallet selected. Create one to get started."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;