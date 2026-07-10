import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

/**
 * Slim in-flow strip rendered under the app header while the browser is offline.
 * Renders nothing when online. No glow — a flat amber tint per the sync-UI spec.
 */
export const OfflineBanner: React.FC = () => {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-amber-400/30 bg-amber-400/15 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-300"
    >
      <WifiOff size={14} className="shrink-0" aria-hidden />
      <span>
        You're offline — changes are saved locally and will sync when you
        reconnect.
      </span>
    </div>
  );
};

export default OfflineBanner;
