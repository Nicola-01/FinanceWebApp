import React from "react";
import { Bell } from "lucide-react";
import Button from "../../components/ui/Button";
import { useNotifications } from "./useNotifications";
import { NotificationCenterOverlay } from "./NotificationCenterOverlay";

/**
 * Header bell that opens the notification center. Shows a small amber unread dot
 * (no count, no glow) while there are unread notifications. The dot is a sibling
 * of the button so it isn't clipped by the button's `overflow-hidden`.
 */
export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, open, openCenter, closeCenter } =
    useNotifications();

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={openCenter}
          aria-label="Notifications"
        >
          <Bell size={18} aria-hidden />
        </Button>
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400"
          />
        )}
      </div>

      <NotificationCenterOverlay
        open={open}
        onClose={closeCenter}
        notifications={notifications}
      />
    </>
  );
};

export default NotificationBell;
