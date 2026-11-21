import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import Toggle from "../../components/ui/Toggle";
import { triggerToast } from "../../components/ui/ToastNotification";
import { useUiVersion } from "../../hooks/useUiVersion";
import {
  getEnrollment,
  subscribeThisDevice,
  unsubscribeThisDevice,
  type PushEnrollment,
} from "../../push/pushClient";
import { WalletNotificationOptions } from "../../push/WalletNotificationOptions";
import {
  saveWalletNotificationPrefs,
  setWalletEnabled,
  type WalletNotificationPrefs,
  type WalletPrefsEntry,
} from "../../push/walletNotifications";

type PrefKey = "invites" | "monthlyReport" | "yearlyReport";

type NotificationPrefs = Record<PrefKey, boolean>;

interface PreferencesResponse extends NotificationPrefs {
  wallets: WalletPrefsEntry[];
}

const REPORT_PREFS: { key: PrefKey; label: string; hint: string }[] = [
  {
    key: "monthlyReport",
    label: "Monthly report",
    hint: "A summary of last month",
  },
  { key: "yearlyReport", label: "Yearly wrap-up", hint: "Your year in review" },
];

/** ui-v2-switch: a group label above a flat divided card (no inner titles). */
const V2Group: React.FC<{
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <section className="flex flex-col">
    <h3 className="mb-2 px-1 text-[13px] text-app-muted">{label}</h3>
    <Card padding="none">
      <div className="flex flex-col divide-y divide-app-border">{children}</div>
    </Card>
    {hint && <p className="mt-2 px-1 text-[13px] text-app-muted">{hint}</p>}
  </section>
);

/** ui-v2-switch: one toggle row — label + muted sub line left, switch right. */
const V2ToggleRow: React.FC<{
  label: string;
  sub?: string;
  children: React.ReactNode;
}> = ({ label, sub, children }) => (
  <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
    <div className="min-w-0">
      <span className="block text-[15px] text-app-text">{label}</span>
      {sub && <span className="block text-[13px] text-app-muted">{sub}</span>}
    </div>
    {children}
  </div>
);

/**
 * Settings → Notifications: cards managing all notification preferences —
 *  1. this device's browser subscription (enroll / unenroll),
 *  2. per-wallet switches (plus the global invitations toggle); an enabled
 *     wallet expands into its per-event-type options,
 *  3. periodic report opt-ins (each gates both the email and its push).
 * Outside a wallet, so it uses the brand tokens (no per-wallet accent).
 */
export const NotificationsSection: React.FC = () => {
  const [enrollment, setEnrollment] = useState<PushEnrollment | null>(null);
  const [deviceBusy, setDeviceBusy] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [wallets, setWallets] = useState<WalletPrefsEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ui] = useUiVersion();
  const isV2 = ui === "v2"; // ui-v2-switch

  useEffect(() => {
    void getEnrollment().then(setEnrollment);

    void (async () => {
      try {
        const res = await api.get<PreferencesResponse>(
          "/users/me/notification-preferences",
        );
        const { wallets: entries, ...rest } = res.data;
        setPrefs({
          invites: rest.invites,
          monthlyReport: rest.monthlyReport,
          yearlyReport: rest.yearlyReport,
        });
        setWallets(entries ?? []);
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

  // ─── Per-wallet preferences (optimistic + revert) ──────────────────────────

  const handleWalletChange = async (
    walletId: string,
    next: WalletNotificationPrefs,
  ) => {
    const previous = wallets;
    setWallets((prev) =>
      prev.map((w) => (w.walletId === walletId ? { ...w, ...next } : w)),
    );
    try {
      await saveWalletNotificationPrefs(walletId, next);
    } catch {
      setWallets(previous);
      triggerToast("Could not update wallet notifications", false);
    }
  };

  const handleWalletToggle = (w: WalletPrefsEntry, enabled: boolean) => {
    setExpanded(enabled ? w.walletId : null);
    void handleWalletChange(w.walletId, setWalletEnabled(w, enabled));
  };

  const deviceDisabled =
    deviceBusy || enrollment === "disabled-server" || enrollment === "denied";

  if (isV2) {
    // ui-v2-switch
    const deviceNote =
      enrollment === "denied"
        ? "Notifications are blocked — allow them in your browser settings."
        : enrollment === "disabled-server"
          ? "Push is not configured on this server."
          : undefined;
    return (
      <div className="flex flex-col gap-6">
        <V2Group
          label="This device"
          hint="On iPhone/iPad, install the app to your Home Screen first (iOS 16.4+)."
        >
          {enrollment === "unsupported" ? (
            <p className="px-4 py-3 text-[15px] text-app-muted">
              Push is not supported in this browser.
            </p>
          ) : (
            <V2ToggleRow
              label="Enable push notifications on this device"
              sub={deviceNote}
            >
              <Toggle
                checked={enrollment === "subscribed"}
                onChange={handleDeviceToggle}
                disabled={deviceDisabled}
                aria-label="Enable push notifications on this device"
              />
            </V2ToggleRow>
          )}
        </V2Group>

        <V2Group label="Wallets">
          <V2ToggleRow
            label="Wallet invitations"
            sub="When someone invites you to a wallet"
          >
            <Toggle
              checked={prefs ? prefs.invites : false}
              onChange={(nextVal) => handlePrefToggle("invites", nextVal)}
              disabled={!prefs}
              aria-label="Wallet invitations"
            />
          </V2ToggleRow>
          {wallets.length === 0 ? (
            <p className="px-4 py-3 text-[15px] text-app-muted">
              You have no wallets yet.
            </p>
          ) : (
            wallets.map((w) => {
              const enabled = !w.muted;
              const isOpen = enabled && expanded === w.walletId;
              return (
                <div key={w.walletId} className="flex flex-col gap-3 px-4 py-3">
                  <div className="flex min-h-14 items-center justify-between gap-4">
                    <span className="min-w-0 flex-1 truncate text-[15px] text-app-text">
                      {w.walletName}
                    </span>
                    {enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(isOpen ? null : w.walletId)}
                        aria-expanded={isOpen}
                        aria-label={`Options for ${w.walletName}`}
                      >
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </Button>
                    )}
                    <Toggle
                      checked={enabled}
                      onChange={(nextVal) => handleWalletToggle(w, nextVal)}
                      aria-label={`Notifications for ${w.walletName}`}
                    />
                  </div>
                  {isOpen && (
                    <WalletNotificationOptions
                      prefs={w}
                      onChange={(next) =>
                        void handleWalletChange(w.walletId, next)
                      }
                    />
                  )}
                </div>
              );
            })
          )}
        </V2Group>

        <V2Group
          label="Periodic reports"
          hint="Emailed as a PDF, with a push notification when it's ready."
        >
          {REPORT_PREFS.map((pref) => (
            <V2ToggleRow key={pref.key} label={pref.label} sub={pref.hint}>
              <Toggle
                checked={prefs ? prefs[pref.key] : false}
                onChange={(nextVal) => handlePrefToggle(pref.key, nextVal)}
                disabled={!prefs}
                aria-label={pref.label}
              />
            </V2ToggleRow>
          ))}
        </V2Group>
      </div>
    );
  }

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

      {/* 2. Per-wallet preferences */}
      <Card title="Wallets">
        <div className="flex flex-col divide-y divide-app-border">
          <div className="flex items-center justify-between gap-4 pb-3">
            <div className="min-w-0">
              <span className="block text-sm font-medium text-app-text">
                Wallet invitations
              </span>
              <span className="text-xs text-app-muted">
                When someone invites you to a wallet
              </span>
            </div>
            <Toggle
              checked={prefs ? prefs.invites : false}
              onChange={(nextVal) => handlePrefToggle("invites", nextVal)}
              disabled={!prefs}
              aria-label="Wallet invitations"
            />
          </div>

          {wallets.length === 0 ? (
            <p className="pt-3 text-sm text-app-muted">
              You have no wallets yet.
            </p>
          ) : (
            wallets.map((w) => {
              const enabled = !w.muted;
              const isOpen = enabled && expanded === w.walletId;
              return (
                <div key={w.walletId} className="py-3 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-text">
                      {w.walletName}
                    </span>
                    {enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(isOpen ? null : w.walletId)}
                        aria-expanded={isOpen}
                        aria-label={`Options for ${w.walletName}`}
                      >
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </Button>
                    )}
                    <Toggle
                      checked={enabled}
                      onChange={(nextVal) => handleWalletToggle(w, nextVal)}
                      aria-label={`Notifications for ${w.walletName}`}
                    />
                  </div>
                  {isOpen && (
                    <div className="mt-3 rounded-[var(--r-input)] border border-app-border bg-app-surface px-4 py-3">
                      <WalletNotificationOptions
                        prefs={w}
                        onChange={(next) =>
                          void handleWalletChange(w.walletId, next)
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
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
    </div>
  );
};

export default NotificationsSection;
