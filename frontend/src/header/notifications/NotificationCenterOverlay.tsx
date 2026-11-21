import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay";
import { useUiVersion } from "../../hooks/useUiVersion";
import type { AppNotification } from "./useNotifications";

interface NotificationCenterOverlayProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  /** Selected wallet's colour; violet brand accent when no wallet is selected. */
  accentColor?: string;
}

// Class sets per UI version. v1 strings are kept verbatim from before the v2 look.
const STYLE = {
  v1: {
    empty: "py-10 text-center text-sm text-app-muted",
    list: "flex flex-col gap-2",
    row: "flex w-full items-start gap-3 rounded-xl border border-app-border bg-app-input p-3 text-left transition-colors hover:bg-app-hover",
    dot: "bg-amber-400",
    title: "block truncate text-sm font-semibold text-app-text",
    body: "block text-sm text-app-muted",
    time: "mt-1 block text-xs text-app-muted",
  },
  v2: {
    empty: "py-6 text-center text-[13px] text-app-muted",
    list: "divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]",
    row: "flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-app-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-text",
    dot: "bg-app-warn",
    title: "block truncate text-[15px] text-app-text",
    body: "line-clamp-2 block text-[13px] text-app-muted",
    time: "block shrink-0 text-[13px] text-app-faint tabular-nums",
  },
} as const;

/**
 * Notification center: a right drawer (mobile full-screen) listing the caller's
 * notifications, newest first. Unread rows carry a leading amber dot; clicking a
 * row navigates to its target and closes the center. Purely presentational —
 * state + lifecycle live in {@link useNotifications}.
 */
export const NotificationCenterOverlay: React.FC<
  NotificationCenterOverlayProps
> = ({ open, onClose, notifications, accentColor }) => {
  const navigate = useNavigate();
  const [ui] = useUiVersion();
  const s = ui === "v2" ? STYLE.v2 : STYLE.v1; // ui-v2-switch

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
      accentColor={accentColor ?? "var(--brand-1)"}
    >
      {notifications.length === 0 ? (
        <p className={s.empty}>You&apos;re all caught up.</p>
      ) : (
        <ul className={s.list}>
          {notifications.map((n) => {
            const when = formatDistanceToNow(new Date(n.createdAt), {
              addSuffix: true,
            });
            const dot = (
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  n.read ? "" : s.dot
                }`}
              />
            );
            const title = (
              <span
                className={`${s.title}${ui === "v2" && !n.read ? " font-semibold" : ""}`}
              >
                {n.title}
              </span>
            );
            const body = <span className={s.body}>{n.body}</span>;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleRowClick(n)}
                  className={s.row}
                >
                  {ui === "v2" ? (
                    // ui-v2-switch: time sits top-right, outside the text column.
                    <>
                      {dot}
                      <span className="min-w-0 flex-1">
                        {title}
                        {body}
                      </span>
                      <span className={s.time}>{when}</span>
                    </>
                  ) : (
                    <>
                      {dot}
                      <span className="min-w-0 flex-1">
                        {title}
                        {body}
                        <span className={s.time}>{when}</span>
                      </span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ResponsiveOverlay>
  );
};

export default NotificationCenterOverlay;
