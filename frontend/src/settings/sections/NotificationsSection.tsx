import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import Toggle from "../../components/ui/Toggle";
import { triggerToast } from "../../components/ui/ToastNotification";
import {
  getEnrollment,
  subscribeThisDevice,
  unsubscribeThisDevice,
  type PushEnrollment,
} from "../../push/pushClient";

type PrefKey =
  | "invites"
  | "transactions"
  | "subscriptions"
  | "recurringExecutions"
  | "monthlyReport"
  | "yearlyReport";

interface NotificationPrefs {
  invites: boolean;
  transactions: boolean;
  subscriptions: boolean;
  recurringExecutions: boolean;
  monthlyReport: boolean;
  yearlyReport: boolean;
}

interface WalletMute {
  walletId: string;
  walletName: string;
  muted: boolean;
}

interface PreferencesResponse extends NotificationPrefs {
  walletMutes: WalletMute[];
}

const GLOBAL_PREFS: { key: PrefKey; label: string }[] = [
  { key: "invites", label: "Wallet invitations" },
  { key: "transactions", label: "Transactions in shared wallets" },
  { key: "subscriptions", label: "Subscriptions in shared wallets" },
  { key: "recurringExecutions", label: "Recurring executions" },
];

const REPORT_PREFS: { key: PrefKey; label: string; hint: string }[] = [
  {
    key: "monthlyReport",
    label: "Monthly report",
    hint: "A summary of last month",
  },
  { key: "yearlyReport", label: "Yearly wrap-up", hint: "Your year in review" },
];

/**
 * Settings → Notifications: cards managing all notification preferences —
 *  1. this device's browser subscription (enroll / unenroll),
 *  2. global per-event-type toggles (invites / transactions / subscriptions /
 *     recurring executions),
 *  3. periodic report opt-ins (each gates both the email and its push),
 *  4. per-wallet mute switches.
 * Outside a wallet, so it uses the brand tokens (no per-wallet accent).
 */
export const NotificationsSection: React.FC = () => {
  const [enrollment, setEnrollment] = useState<PushEnrollment | null>(null);
  const [deviceBusy, setDeviceBusy] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [walletMutes, setWalletMutes] = useState<WalletMute[]>([]);

  useEffect(() => {
    void getEnrollment().then(setEnrollment);

    void (async () => {
      try {
        const res = await api.get<PreferencesResponse>(
          "/users/me/notification-preferences",
        );
        const { walletMutes: mutes, ...rest } = res.data;
        setPrefs({
          invites: rest.invites,
          transactions: rest.transactions,
          subscriptions: rest.subscriptions,
          recurringExecutions: rest.recurringExecutions,
          monthlyReport: rest.monthlyReport,
          yearlyReport: rest.yearlyReport,
        });
        setWalletMutes(mutes ?? []);
      } catch {
        triggerToast("Failed to load notification preferences", false);
      }
    })();
  }, []);

  // ─── This device ───────────────────────────────────────────────────────────

  const handleDeviceToggle = async (next: boolean) => {
    setDeviceBusy(true);
    try {
      if (next) {
        const result = await subscribeThisDevice();
        setEnrollment(result);
        if (result === "subscribed") {
          triggerToast("Push enabled on this device", true);
        } else if (result === "denied") {
          triggerToast("Notifications are blocked in your browser", false);
        } else if (result === "disabled-server") {
          triggerToast("Push is not configured on this server", false);
        }
      } else {
        await unsubscribeThisDevice();
        setEnrollment("unsubscribed");
        triggerToast("Push disabled on this device", true);
      }
    } catch {
      triggerToast("Could not update push notifications", false);
    } finally {
      setDeviceBusy(false);
    }
  };

  // ─── Global preferences (optimistic + revert) ──────────────────────────────

  const handlePrefToggle = async (key: PrefKey, next: boolean) => {
    if (!prefs) return;
    const previous = prefs;
    const updated = { ...prefs, [key]: next };
    setPrefs(updated);
    try {
      await api.put("/users/me/notification-preferences", updated);
    } catch {
      setPrefs(previous);
      triggerToast("Could not update notification preferences", false);
    }
  };

  // ─── Per-wallet mute (optimistic + revert) ─────────────────────────────────

  const handleMuteToggle = async (walletId: string, next: boolean) => {
    const previous = walletMutes;
    setWalletMutes((prev) =>
      prev.map((w) => (w.walletId === walletId ? { ...w, muted: next } : w)),
    );
    try {
      await api.put(`/wallets/${walletId}/notification-mute`, { muted: next });
    } catch {
      setWalletMutes(previous);
      triggerToast("Could not update wallet notifications", false);
    }
  };

  const deviceDisabled =
    deviceBusy || enrollment === "disabled-server" || enrollment === "denied";

  return (
    <div className="flex flex-col gap-6">
      {/* 1. This device */}
      <Card title="This device">
        {enrollment === "unsupported" ? (
          <p className="text-sm text-app-muted">
            Push is not supported in this browser.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-app-text">
                Enable push notifications on this device
              </span>
              <Toggle
                checked={enrollment === "subscribed"}
                onChange={handleDeviceToggle}
                disabled={deviceDisabled}
                aria-label="Enable push notifications on this device"
              />
            </div>

            {enrollment === "denied" && (
              <p className="text-sm text-app-muted">
                Notifications are blocked — allow them in your browser settings.
              </p>
            )}
            {enrollment === "disabled-server" && (
              <p className="text-sm text-app-muted">
                Push is not configured on this server.
              </p>
            )}

            <p className="text-xs text-app-muted">
              On iPhone/iPad, install the app to your Home Screen first (iOS
              16.4+).
            </p>
          </div>
        )}
      </Card>

      {/* 2. Global per-event-type preferences */}
      <Card title="What you get notified about">
        <div className="flex flex-col divide-y divide-app-border">
          {GLOBAL_PREFS.map((pref) => (
            <div
              key={pref.key}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="text-sm font-medium text-app-text">
                {pref.label}
              </span>
              <Toggle
                checked={prefs ? prefs[pref.key] : false}
                onChange={(nextVal) => handlePrefToggle(pref.key, nextVal)}
                disabled={!prefs}
                aria-label={pref.label}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Periodic report emails (each toggle also gates its push notification) */}
      <Card title="Periodic reports">
        <p className="mb-3 text-xs text-app-muted">
          Emailed as a PDF, with a push notification when it's ready.
        </p>
        <div className="flex flex-col divide-y divide-app-border">
          {REPORT_PREFS.map((pref) => (
            <div
              key={pref.key}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <span className="block text-sm font-medium text-app-text">
                  {pref.label}
                </span>
                <span className="text-xs text-app-muted">{pref.hint}</span>
              </div>
              <Toggle
                checked={prefs ? prefs[pref.key] : false}
                onChange={(nextVal) => handlePrefToggle(pref.key, nextVal)}
                disabled={!prefs}
                aria-label={pref.label}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Per-wallet mute */}
      <Card title="Per-wallet">
        {walletMutes.length === 0 ? (
          <p className="text-sm text-app-muted">
            You have no shared wallets yet.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-app-border">
            {walletMutes.map((w) => (
              <div
                key={w.walletId}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-text">
                  {w.walletName}
                </span>
                <Toggle
                  checked={w.muted}
                  onChange={(nextVal) => handleMuteToggle(w.walletId, nextVal)}
                  label="Mute this wallet"
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationsSection;
