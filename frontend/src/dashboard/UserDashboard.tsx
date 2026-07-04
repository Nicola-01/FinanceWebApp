import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WalletsBar } from "./wallet/WalletsBar.tsx";
import { WalletDashboard } from "./wallet/WalletDashboard.tsx";
import { DashboardBackground } from "./DashboardBackground.tsx";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import type { Wallet } from "../utils/types";
import { useDeleteModal } from "../modals/common/DeleteModalContext";
import { ConfirmModal } from "../modals/common/ConfirmModal.tsx";
import { AppHeader } from "../header/AppHeader.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPiggyBank } from "@fortawesome/free-solid-svg-icons";
import { getApiErrorTitle } from "../utils/apiError";
import { walletSlug } from "../utils/walletSlug";

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

        const savedOrderStr = localStorage.getItem("wallet_order");
        if (savedOrderStr) {
          try {
            const savedOrder = JSON.parse(savedOrderStr) as string[];

            const firstValidSavedId = savedOrder.find((savedId) =>
              fetchedWallets.some((wallet) => wallet.id === savedId),
            );

            if (firstValidSavedId) targetId = firstValidSavedId;
          } catch (e) {
            console.error("Error parsing wallet_order from localStorage", e);
          }
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
    // Caricamento una tantum al mount: scarica tutti i wallet una sola volta.
    // Il redirect sul wallet selezionato è gestito dall'effetto successivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Risolve lo slug URL (`nome-<ultimi5uuid>`) verso un wallet della lista.
  // 1) match esatto sull'id -> retrocompatibilità con vecchi link full-UUID.
  // 2) match sul suffisso -> ultimo segmento dello slug == ultimi 5 char dell'id.
  const resolveWallet = (param: string | undefined): Wallet | null => {
    if (!param) return null;
    const exact = wallets.find((w) => w.id === param);
    if (exact) return exact;
    const suffix = param.split("-").pop();
    return wallets.find((w) => w.id.slice(-5) === suffix) || null;
  };

  // Gestisce due casi sul cambio di walletId/lista:
  // - il wallet risolto ha uno slug diverso dal param (vecchio UUID o nome
  //   cambiato) -> riscrive l'URL nella forma canonica (replace).
  // - il param non risolve alcun wallet (es. cancellato) -> naviga al primo.
  useEffect(() => {
    if (loading || wallets.length === 0 || !walletId) return;
    const current = resolveWallet(walletId);
    if (current) {
      const canonical = walletSlug(current);
      if (walletId !== canonical)
        navigate(`/dashboard/${canonical}`, { replace: true });
    } else {
      navigate(`/dashboard/${walletSlug(wallets[0])}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId, wallets, loading, navigate]);

  const selectedWallet = resolveWallet(walletId);

  const deleteModalRef = useDeleteModal();
  const [quitTarget, setQuitTarget] = useState<Wallet | null>(null);
  const [isQuitting, setIsQuitting] = useState(false);

  // Same DELETE endpoint backs both flows: for an OWNER it deletes the wallet,
  // for a non-owner the backend treats it as leaving. Only the copy differs.
  const handleConfirmDelete = async (
    idToDelete: string,
    successMsg = "Deleted!",
  ) => {
    try {
      await api.delete(`/wallets/${idToDelete}`);
      setWallets((prev) => prev.filter((w) => w.id !== idToDelete));
      triggerToast(successMsg, true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Error deleting."), false);
    }
  };

  const confirmQuit = async () => {
    if (!quitTarget) return;
    setIsQuitting(true);
    await handleConfirmDelete(quitTarget.id, "You left the wallet");
    setIsQuitting(false);
    setQuitTarget(null);
  };

  function handleChangeWallet(id: string) {
    const w = wallets.find((wallet) => wallet.id === id);
    navigate(`/dashboard/${w ? walletSlug(w) : id}`);
  }

  return (
    // Mobile: min-h-screen (whole page scrolls). Desktop: h-screen + overflow-hidden
    // (fixed layout). `relative isolate` scopes the ambient sphere layer below.
    <div className="relative isolate flex flex-col min-h-screen xl:h-screen xl:overflow-hidden bg-app-bg text-app-text transition-colors">
      {/* Ambient animated spheres (sits at -z-10, behind the content) */}
      <DashboardBackground />

      {/* The header takes its fixed slot at the top */}
      <AppHeader page={{ text: "My", accent: "Wallet" }} />

      {/* Desktop: clip the overflow spilling out of the flex layout */}
      <div className="flex flex-col xl:flex-row flex-1 xl:overflow-hidden">
        {/* La barra laterale prenderà xl:h-full e scorrerà da sola */}
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
              onWalletDelete={() => {
                if (selectedWallet.userRole === "OWNER") {
                  deleteModalRef.current?.deleteObject(
                    selectedWallet,
                    "wallet",
                    async () => await handleConfirmDelete(selectedWallet.id),
                    2,
                  );
                } else {
                  // Non-owners quit (leave) the wallet — not a destructive delete.
                  setQuitTarget(selectedWallet);
                }
              }}
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
        onCancel={() => setQuitTarget(null)}
      />
    </div>
  );
};

export default UserDashboard;
