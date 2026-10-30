import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WalletsBar } from "./wallet/WalletsBar.tsx";
import { WalletDashboard } from "./wallet/WalletDashboard.tsx";
import { DashboardBackground } from "./DashboardBackground.tsx";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import type { Wallet } from "../types/domain";
import { ConfirmModal } from "../modals/common/ConfirmModal.tsx";
import { AppHeader } from "../header/AppHeader.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPiggyBank } from "@fortawesome/free-solid-svg-icons";
import { walletSlug } from "../utils/walletSlug";
import { readWalletOrder } from "../utils/walletOrder";
import { useWalletRouting } from "./useWalletRouting";
import { useWalletDeletion } from "./useWalletDeletion";

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

      const wRes = await api.get("/wallets");
      const fetchedWallets: Wallet[] = wRes.data;
      setWallets(fetchedWallets);

      if (!walletId && fetchedWallets.length > 0) {
        let targetId = fetchedWallets[0].id;

        const savedOrder = readWalletOrder();
        if (savedOrder) {
          const firstValidSavedId = savedOrder.find((savedId) =>
            fetchedWallets.some((wallet) => wallet.id === savedId),
          );

          if (firstValidSavedId) targetId = firstValidSavedId;
        }
        const target = fetchedWallets.find((w) => w.id === targetId);
        if (target)
          navigate(`/dashboard/${walletSlug(target)}`, { replace: true });
      }
    } catch {
      triggerToast("Error loading data", false);
    } finally {
      setLoading(false);
    }
  };

  // Execute on first load
  useEffect(() => {
    fetchData();
    // One-shot load on mount: fetch all wallets once.
    // Redirecting to the selected wallet is handled by the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedWallet = useWalletRouting(wallets, loading, walletId);

  const { quitTarget, isQuitting, confirmQuit, cancelQuit, requestDelete } =
    useWalletDeletion(setWallets);

  function handleChangeWallet(id: string) {
    const w = wallets.find((wallet) => wallet.id === id);
    navigate(`/dashboard/${w ? walletSlug(w) : id}`);
  }

  return (
    // Mobile: min-h-screen (whole page scrolls). Desktop: h-screen + overflow-hidden
    // (fixed layout). `relative isolate` scopes the ambient sphere layer below.
    <div className="relative isolate flex flex-col min-h-screen xl:h-screen xl:overflow-hidden bg-app-bg text-app-text transition-colors">
      {/* Ambient animated spheres (sits at -z-10, behind the content) */}
      <DashboardBackground fixed />

      {/* The header takes its fixed slot at the top */}
      <AppHeader
        page={{ text: "My", accent: "Wallet" }}
        accentColor={selectedWallet?.color}
      />

      {/* Desktop: clip the overflow spilling out of the flex layout */}
      <div className="flex flex-col xl:flex-row flex-1 xl:overflow-hidden">
        {/* The sidebar takes xl:h-full and scrolls on its own */}
        <WalletsBar
          wallets={wallets}
          setWallets={setWallets}
          loading={loading}
          selectedWalletId={selectedWallet?.id}
          onSelectWallet={(id) => handleChangeWallet(id)}
          onRefreshAll={fetchData}
        />

        {/* Desktop: only this right area scrolls vertically. Kept transparent so
            the ambient spheres show through the gaps between content cards. */}
        <div className="flex-1 flex flex-col xl:overflow-y-auto custom-scrollbar">
          {selectedWallet ? (
            <WalletDashboard
              _wallet={selectedWallet}
              key={selectedWallet.id}
              onWalletUpdate={fetchData}
              onWalletDelete={() => requestDelete(selectedWallet)}
            />
          ) : (
            <div className="flex h-full min-h-[50vh] items-center justify-center text-app-muted">
              {loading ? (
                "Loading data..."
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-app-muted">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-input">
                    <FontAwesomeIcon
                      icon={faPiggyBank}
                      className="text-2xl opacity-50"
                    />
                  </div>
                  <p className="text-sm font-bold">No wallets found.</p>
                  <p className="mt-1 text-xs opacity-60 font-medium">
                    Click "New Wallet" to add your first one.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!quitTarget}
        title="Quit wallet"
        message={
          <>
            Remove your access to <strong>{quitTarget?.name}</strong>? You will
            need the owner to invite you again to regain access.
          </>
        }
        confirmLabel="Quit Wallet"
        tone="danger"
        busy={isQuitting}
        onConfirm={confirmQuit}
        onCancel={cancelQuit}
      />
    </div>
  );
};

export default UserDashboard;
