import type React from "react";
import { useState } from "react";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import type { Wallet } from "../types/domain";
import { useDeleteModal } from "../modals/common/DeleteModalContext";
import { getApiErrorTitle } from "../utils/apiError";

/**
 * Delete (OWNER, via the shared DeleteModal) or quit (non-owner, via the
 * caller's ConfirmModal bound to `quitTarget`/`isQuitting`/`confirmQuit`).
 */
export function useWalletDeletion(
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>,
) {
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

  const requestDelete = (wallet: Wallet) => {
    if (wallet.userRole === "OWNER") {
      deleteModalRef.current?.deleteObject(
        wallet,
        "wallet",
        async () => await handleConfirmDelete(wallet.id),
        2,
      );
    } else {
      // Non-owners quit (leave) the wallet — not a destructive delete.
      setQuitTarget(wallet);
    }
  };

  const cancelQuit = () => setQuitTarget(null);

  return { quitTarget, isQuitting, confirmQuit, cancelQuit, requestDelete };
}
