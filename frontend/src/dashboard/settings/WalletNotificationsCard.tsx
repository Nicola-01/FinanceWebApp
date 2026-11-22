import React, { useEffect, useState } from "react";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { SettingsBox } from "./SettingsBox.tsx";
import { useUiVersion } from "../../hooks/useUiVersion.ts";
import Toggle from "../../components/ui/Toggle.tsx";
import { ExpandableRow } from "../../components/ui/ExpandableRow.tsx";
import { V2Group, V2ToggleRow } from "../../components/ui/V2Group.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { useWalletContext } from "../wallet/WalletContext.tsx";
import { WalletNotificationOptions } from "../../push/WalletNotificationOptions.tsx";
import {
  saveWalletNotificationPrefs,
  setWalletEnabled,
  withReportDefaults,
  type WalletNotificationPrefs,
  type WalletPrefsEntry,
} from "../../push/walletNotifications.ts";

const REPORT_ROWS = [
  {
    key: "monthlyReport",
    label: "Monthly report",
    hint: "Include this wallet in your monthly summary",
  },
  {
    key: "yearlyReport",
    label: "Yearly wrap-up",
    hint: "Include this wallet in your year in review",
  },
] as const;

/** The caller's notification preferences for this wallet (hidden until loaded). */
export const WalletNotificationsCard: React.FC = () => {
  const { wallet } = useWalletContext();
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch
  const [prefs, setPrefs] = useState<WalletNotificationPrefs | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false); // ui-v2-switch

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ wallets: WalletPrefsEntry[] }>(
        "/users/me/notification-preferences",
      )
      .then((res) => {
        const entry = res.data.wallets?.find((w) => w.walletId === wallet.id);
        if (!cancelled) setPrefs(entry ? withReportDefaults(entry) : null);
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

  if (isV2) {
    // ui-v2-switch: no SettingsBox surface here; the groups are the cards, so
    // the wallet settings tab doesn't stack a card inside a card.
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-app-text">
            Notifications
          </h3>
          <p className="text-[13px] text-app-muted">
            Choose what this wallet notifies you about
          </p>
        </div>
        <V2Group label="Push notifications">
          <ExpandableRow
            isV2
            label="Notify me about this wallet"
            sub="Turn off to silence this wallet entirely."
            open={optionsOpen}
            onToggleOpen={() => setOptionsOpen((open) => !open)}
            chevronLabel="Notification options for this wallet"
            control={
              <Toggle
                size="md"
                checked={!prefs.muted}
                onChange={(enabled) =>
                  void save(setWalletEnabled(prefs, enabled))
                }
                accentColor={wallet.color}
                aria-label="Notify me about this wallet"
              />
            }
          >
            <WalletNotificationOptions
              prefs={prefs}
              onChange={(next) => void save(next)}
              accentColor={wallet.color}
              size="md"
              disabled={prefs.muted}
            />
          </ExpandableRow>
        </V2Group>
        <V2Group label="Periodic reports">
          {REPORT_ROWS.map((row) => (
            <V2ToggleRow key={row.key} label={row.label} sub={row.hint}>
              <Toggle
                size="md"
                checked={prefs[row.key]}
                onChange={(included) =>
                  void save({ ...prefs, [row.key]: included })
                }
                accentColor={wallet.color}
                aria-label={`Include in ${row.label.toLowerCase()}`}
              />
            </V2ToggleRow>
          ))}
        </V2Group>
      </div>
    );
  }

  return (
    <SettingsBox
      title="Notifications"
      description="Choose what this wallet notifies you about"
      icon={faBell}
      iconColor={wallet.color}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="block text-sm font-medium text-app-text">
              Notify me about this wallet
            </span>
          </div>
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
        {REPORT_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4"
          >
            <span className="block text-sm font-medium text-app-text">
              Include in {row.label.toLowerCase()}
            </span>
            <Toggle
              checked={prefs[row.key]}
              onChange={(included) =>
                void save({ ...prefs, [row.key]: included })
              }
              accentColor={wallet.color}
              aria-label={`Include in ${row.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    </SettingsBox>
  );
};

export default WalletNotificationsCard;
