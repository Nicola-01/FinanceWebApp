import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useUiVersion } from "../../hooks/useUiVersion";

/**
 * Slim in-flow strip rendered under the app header while the browser is offline.
 * Renders nothing when online. No glow — a flat amber tint per the sync-UI spec.
 */
export const OfflineBanner: React.FC = () => {
  const online = useOnlineStatus();
  const [ui] = useUiVersion();
  if (online) return null;

  return (
    <div
      role="status"
      className={
        ui === "v2"
          ? // ui-v2-switch: status = warn colour on a 16% tint (icon + text carry the meaning too).
            "flex items-center justify-center gap-2 bg-[color-mix(in_srgb,currentColor_16%,transparent)] px-4 py-1.5 text-xs font-medium text-app-warn"
          : "flex items-center justify-center gap-2 border-b border-amber-400/30 bg-amber-400/15 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-300"
      }
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
