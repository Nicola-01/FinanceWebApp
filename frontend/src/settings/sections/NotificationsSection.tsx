import React, { useEffect, useState } from "react";
import api from "../../api/axiosConfig";
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
  withReportDefaults,
  type WalletNotificationPrefs,
  type WalletPrefsEntry,
} from "../../push/walletNotifications";
import { ExpandableRow } from "../../components/ui/ExpandableRow";
import { V2Group, V2ToggleRow } from "../../components/ui/V2Group";

type ReportKey = "monthlyReport" | "yearlyReport";
type PrefKey = "invites" | ReportKey;

/** Solid on-state fill for every toggle here (the app accent, resolved by Toggle). */
const ACCENT = "var(--brand-1)";

type NotificationPrefs = Record<PrefKey, boolean>;

interface PreferencesResponse extends NotificationPrefs {
  wallets: WalletPrefsEntry[];
}

const REPORT_PREFS: { key: ReportKey; label: string; hint: string }[] = [
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
 *  2. per-wallet switches (plus the global invitations toggle); an enabled
 *     wallet expands into its per-event-type options,
 *  3. periodic reports (each gates its email and push); an enabled report
 *     expands into the wallets it covers.
 * Outside a wallet, so it uses the brand tokens (no per-wallet accent).
 */
export const NotificationsSection: React.FC = () => {
  const [enrollment, setEnrollment] = useState<PushEnrollment | null>(null);
  const [deviceBusy, setDeviceBusy] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [wallets, setWallets] = useState<WalletPrefsEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reportExpanded, setReportExpanded] = useState<
    Record<ReportKey, boolean>
  >({ monthlyReport: false, yearlyReport: false });
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
        setWallets((entries ?? []).map(withReportDefaults));
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

  const handleWalletReportToggle = (
    w: WalletPrefsEntry,
    key: ReportKey,
    included: boolean,
  ) => void handleWalletChange(w.walletId, { ...w, [key]: included });

  const deviceDisabled =
    deviceBusy || enrollment === "disabled-server" || enrollment === "denied";

  // ─── Shared row builders (both UIs) ────────────────────────────────────────

  const walletRows =
    wallets.length === 0 ? (
      <p
        className={
          isV2
            ? "px-4 py-3 text-[15px] text-app-muted" // ui-v2-switch
            : "pt-3 text-sm text-app-muted"
        }
      >
        You have no wallets yet.
      </p>
    ) : (
      wallets.map((w) => {
        const enabled = !w.muted;
        const isOpen = enabled && expanded === w.walletId;
        return (
          <ExpandableRow
            key={w.walletId}
            isV2={isV2}
            label={w.walletName}
            open={isOpen}
            onToggleOpen={
              enabled
                ? () => setExpanded(isOpen ? null : w.walletId)
                : undefined
            }
            chevronLabel={`Options for ${w.walletName}`}
            control={
              <Toggle
                accentColor={ACCENT}
                checked={enabled}
                onChange={(nextVal) => handleWalletToggle(w, nextVal)}
                aria-label={`Notifications for ${w.walletName}`}
              />
            }
          >
            <WalletNotificationOptions
              prefs={w}
              onChange={(next) => void handleWalletChange(w.walletId, next)}
              accentColor={ACCENT}
              size="md"
            />
          </ExpandableRow>
        );
      })
    );

  const reportRows = REPORT_PREFS.map((pref) => {
    const on = prefs ? prefs[pref.key] : false;
    const isOpen = reportExpanded[pref.key];
    return (
      <ExpandableRow
        key={pref.key}
        isV2={isV2}
        label={pref.label}
        sub={pref.hint}
        open={isOpen}
        onToggleOpen={() =>
          setReportExpanded((prev) => ({
            ...prev,
            [pref.key]: !prev[pref.key],
          }))
        }
        chevronLabel={`Wallets for ${pref.label}`}
        control={
          <Toggle
            accentColor={ACCENT}
            checked={on}
            onChange={(nextVal) => handlePrefToggle(pref.key, nextVal)}
            disabled={!prefs}
            aria-label={pref.label}
          />
        }
      >
        {!on && (
          <p
            className={
              isV2
                ? "pb-2 text-[13px] text-app-muted" // ui-v2-switch
                : "pb-2 text-xs text-app-muted"
            }
          >
            Turn on the report to choose wallets.
          </p>
        )}
        {wallets.length === 0 ? (
          <p
            className={
              isV2
                ? "py-1 text-[15px] text-app-muted" // ui-v2-switch
                : "text-sm text-app-muted"
            }
          >
            You have no wallets yet.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-app-border">
            {wallets.map((w) => (
              <div
                key={w.walletId}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={`min-w-0 flex-1 truncate ${isV2 ? "text-[15px]" : "text-sm"} text-app-text`}
                >
                  {w.walletName}
                </span>
                <Toggle
                  accentColor={ACCENT}
                  checked={w[pref.key]}
                  onChange={(nextVal) =>
                    handleWalletReportToggle(w, pref.key, nextVal)
                  }
                  disabled={!on}
                  aria-label={`Include ${w.walletName} in ${pref.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
        )}
      </ExpandableRow>
    );
  });

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
              accentColor={ACCENT}
              checked={prefs ? prefs.invites : false}
              onChange={(nextVal) => handlePrefToggle("invites", nextVal)}
              disabled={!prefs}
              aria-label="Wallet invitations"
            />
          </V2ToggleRow>
          {walletRows}
        </V2Group>

        <V2Group
          label="Periodic reports"
          hint="Emailed as a PDF, with a push notification when it's ready."
        >
          {reportRows}
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
          {walletRows}
        </div>
      </Card>

      {/* 3. Periodic report emails (each toggle also gates its push notification) */}
      <Card title="Periodic reports">
        <div className="flex flex-col divide-y divide-app-border">
          {reportRows}
        </div>
        <p className="mt-3 text-xs text-app-muted">
          Emailed as a PDF, with a push notification when it's ready.
        </p>
      </Card>
    </div>
  );
};

export default NotificationsSection;
