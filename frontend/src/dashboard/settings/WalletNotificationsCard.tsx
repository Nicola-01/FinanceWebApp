import React, { useEffect, useState } from "react";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card.tsx";
import Toggle from "../../components/ui/Toggle.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { WalletNotificationOptions } from "../../push/WalletNotificationOptions.tsx";
import {
  saveWalletNotificationPrefs,
  setWalletEnabled,
  type WalletNotificationPrefs,
  type WalletPrefsEntry,
} from "../../push/walletNotifications.ts";

/** The caller's notification preferences for this wallet (hidden until loaded). */
export const WalletNotificationsCard: React.FC = () => {
  const { wallet } = useWalletContext();
  const [prefs, setPrefs] = useState<WalletNotificationPrefs | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ wallets: WalletPrefsEntry[] }>(
        "/users/me/notification-preferences",
      )
      .then((res) => {
        const entry = res.data.wallets?.find((w) => w.walletId === wallet.id);
        if (!cancelled) setPrefs(entry ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [wallet.id]);

  if (!prefs) return null;

  const save = async (next: WalletNotificationPrefs) => {
    const previous = prefs;
    setPrefs(next);
    try {
      await saveWalletNotificationPrefs(wallet.id, next);
    } catch {
      setPrefs(previous);
      triggerToast("Could not update wallet notifications", false);
    }
  };

  return (
    <Card
      title="Notifications"
      subtitle="Choose what this wallet notifies you about"
      icon={faBell}
      iconColor={wallet.color}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-app-text">
            Notify me about this wallet
          </span>
          <Toggle
            checked={!prefs.muted}
            onChange={(enabled) => void save(setWalletEnabled(prefs, enabled))}
            accentColor={wallet.color}
            aria-label="Notify me about this wallet"
          />
        </div>
        {!prefs.muted && (
          <div className="rounded-[var(--r-input)] border border-app-border bg-app-surface px-4 py-3">
            <WalletNotificationOptions
              prefs={prefs}
              onChange={(next) => void save(next)}
              accentColor={wallet.color}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default WalletNotificationsCard;
