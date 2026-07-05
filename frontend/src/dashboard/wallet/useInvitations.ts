import { useCallback, useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorDetail } from "../../utils/apiError";
import type { Invitation } from "../../utils/types";

/**
 * Loads the current user's PENDING wallet invitations and exposes accept/reject.
 * `onRefreshAll` runs after a successful accept so the freshly-joined wallet
 * shows up in the wallet list.
 */
export function useInvitations(onRefreshAll: () => void) {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/invitations");
        const pending = (res.data as Invitation[]).filter(
          (i) => i.status === "PENDING",
        );
        if (alive) setInvites(pending);
      } catch {
        if (alive) setInvites([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const accept = useCallback(
    async (walletId: string) => {
      try {
        await api.post(`/invitations/${walletId}/accept`);
        setInvites((prev) => prev.filter((i) => i.wallet.id !== walletId));
        triggerToast("Invitation accepted!", true);
        onRefreshAll();
      } catch (err: unknown) {
        triggerToast(
          getApiErrorDetail(err, "Could not accept invitation"),
          false,
        );
      }
    },
    [onRefreshAll],
  );

  const reject = useCallback(async (walletId: string) => {
    try {
      await api.post(`/invitations/${walletId}/reject`);
      setInvites((prev) => prev.filter((i) => i.wallet.id !== walletId));
      triggerToast("Invitation rejected", true);
    } catch (err: unknown) {
      triggerToast(
        getApiErrorDetail(err, "Could not reject invitation"),
        false,
      );
    }
  }, []);

  return { invites, loading, accept, reject };
}
