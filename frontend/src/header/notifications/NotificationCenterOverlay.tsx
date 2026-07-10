import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay";
import type { AppNotification } from "./useNotifications";

interface NotificationCenterOverlayProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
}

/**
 * Notification center: a right drawer (mobile full-screen) listing the caller's
 * notifications, newest first. Unread rows carry a leading amber dot; clicking a
 * row navigates to its target and closes the center. Purely presentational —
 * state + lifecycle live in {@link useNotifications}.
 */
export const NotificationCenterOverlay: React.FC<
  NotificationCenterOverlayProps
> = ({ open, onClose, notifications }) => {
  const navigate = useNavigate();

  const handleRowClick = (n: AppNotification) => {
    navigate(n.url);
    onClose();
  };

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      title="Notifications"
      width={420}
    >
      {notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-app-muted">
          You&apos;re all caught up.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => handleRowClick(n)}
                className="flex w-full items-start gap-3 rounded-xl border border-app-border bg-app-input p-3 text-left transition-colors hover:bg-app-hover"
              >
                <span
                  aria-hidden
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.read ? "" : "bg-amber-400"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-app-text">
                    {n.title}
                  </span>
                  <span className="block text-sm text-app-muted">{n.body}</span>
                  <span className="mt-1 block text-xs text-app-muted">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ResponsiveOverlay>
  );
};

export default NotificationCenterOverlay;
