import React from "react";
import Toggle from "../components/ui/Toggle";
import {
  WALLET_EVENT_OPTIONS,
  type WalletNotificationPrefs,
} from "./walletNotifications";

interface Props {
  prefs: WalletNotificationPrefs;
  onChange: (next: WalletNotificationPrefs) => void;
  /** Flat accent for the toggles (e.g. `wallet.color`); brand gradient otherwise. */
  accentColor?: string;
}

/**
 * The per-event-type toggles for one wallet's notifications. Shared by
 * Settings → Notifications and the wallet's own Settings tab.
 */
export const WalletNotificationOptions: React.FC<Props> = ({
  prefs,
  onChange,
  accentColor,
}) => (
  <div className="flex flex-col divide-y divide-app-border">
    {WALLET_EVENT_OPTIONS.map((opt) => (
      <div
        key={opt.key}
        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
      >
        <div className="min-w-0">
          <span className="block text-sm font-medium text-app-text">
            {opt.label}
          </span>
          <span className="text-xs text-app-muted">{opt.hint}</span>
        </div>
        <Toggle
          size="sm"
          checked={prefs[opt.key]}
          onChange={(next) => onChange({ ...prefs, [opt.key]: next })}
          accentColor={accentColor}
          aria-label={opt.label}
        />
      </div>
    ))}
  </div>
);

export default WalletNotificationOptions;
