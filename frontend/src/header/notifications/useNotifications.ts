import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../api/axiosConfig";

/** A notification row as returned by `GET /api/notifications`. */
export interface AppNotification {
  id: string;
  type: string;
  walletId?: string;
  title: string;
  body: string;
  url: string;
  createdAt: string;
  read: boolean;
}

/** Grace period after closing the center before read notifications are purged. */
export const PURGE_DELAY_MS = 10_000;

export interface UseNotifications {
  notifications: AppNotification[];
  /** Derived count of unread notifications (drives the bell dot). */
  unreadCount: number;
  open: boolean;
  /** Open the center + mark everything read (optimistic, fire-and-forget POST). */
  openCenter: () => void;
  /** Close the center + arm the 10 s purge of the now-read items. */
  closeCenter: () => void;
  /** Re-fetch the caller's notifications (newest first). */
  refresh: () => Promise<void>;
}

/**
 * Owns the notification-center state and its read-then-purge lifecycle:
 * opening marks everything read, closing arms a {@link PURGE_DELAY_MS} timer
 * that deletes the read rows server-side and drops them locally — re-opening
 * within the grace period cancels that timer, so the read items stay visible.
 */
export function useNotifications(): UseNotifications {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const purgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    // Offline / transient failures keep whatever we already have.
    const res = await api
      .get<AppNotification[]>("/notifications")
      .catch(() => null);
    if (res) setNotifications(res.data ?? []);
  }, []);

  // Fetch on mount and whenever the SW forwards a foreground push. The mount
  // fetch is wrapped in an async IIFE so its state update isn't flagged as a
  // synchronous set-state inside the effect body.
  useEffect(() => {
    void (async () => {
      await refresh();
    })();
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") void refresh();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [refresh]);

  // Never leak the purge timer.
  useEffect(() => {
    return () => {
      if (purgeTimer.current) clearTimeout(purgeTimer.current);
    };
  }, []);

  const openCenter = useCallback(() => {
    if (purgeTimer.current) {
      clearTimeout(purgeTimer.current);
      purgeTimer.current = null;
    }
    setOpen(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void api.post("/notifications/mark-read").catch(() => {});
  }, []);

  const closeCenter = useCallback(() => {
    setOpen(false);
    if (purgeTimer.current) clearTimeout(purgeTimer.current);
    purgeTimer.current = setTimeout(() => {
      purgeTimer.current = null;
      void api.delete("/notifications/read").catch(() => {});
      setNotifications((prev) => prev.filter((n) => !n.read));
    }, PURGE_DELAY_MS);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    open,
    openCenter,
    closeCenter,
    refresh,
  };
}
