import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faLock,
  faShieldAlt,
  faFingerprint,
  faQrcode,
  faEnvelope,
  faRightFromBracket,
  faTriangleExclamation,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { triggerToast } from "../../components/ui/ToastNotification";
import { PasswordInput } from "../../modals/auth/PasswordInput";
import { ConfirmModal } from "../../modals/common/ConfirmModal";
import { PasswordRequirements } from "../../components/auth/PasswordRequirements";
import { isPasswordValid } from "../../components/auth/passwordRequirements";
import { getApiErrorDetail } from "../../utils/apiError";
import { ComingSoonBadge } from "../ComingSoon";

interface SecuritySectionProps {
  /** Forced (mustChangePWD) mode: show a blocking banner on the password card. */
  forced?: boolean;
  /** Called after a successful password change (clears the forced state). */
  onPasswordChanged?: () => void;
}

// ─── MFA method card ─────────────────────────────────────────────────────────

interface MfaMethodProps {
  icon: IconDefinition;
  title: string;
  description: string;
  recommended?: boolean;
}

const MfaMethod: React.FC<MfaMethodProps> = ({
  icon,
  title,
  description,
  recommended,
}) => (
  <div
    className={`flex flex-col gap-3 rounded-[var(--r-input)] border bg-app-input p-4 ${
      recommended ? "border-[var(--brand-1)]/40" : "border-app-border"
    }`}
  >
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] ${
          recommended
            ? "bg-[var(--brand-1)]/15 text-[var(--brand-1)]"
            : "bg-app-surface text-app-muted"
        }`}
      >
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-app-text">{title}</p>
          {recommended && (
            <Badge variant="subtle" tone="brand" uppercase>
              Recommended
            </Badge>
          )}
        </div>
      </div>
    </div>
    <p className="text-xs text-app-muted">{description}</p>
    <div className="mt-auto flex items-center justify-between pt-1">
      <ComingSoonBadge />
      <Button variant="secondary" size="sm" disabled>
        Enable
      </Button>
    </div>
  </div>
);

// ─── Section ─────────────────────────────────────────────────────────────────

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  forced = false,
  onPasswordChanged,
}) => {
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  const [confirmingAll, setConfirmingAll] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const pwValid =
    isPasswordValid(passwords.new, passwords.confirm) &&
    passwords.old.length > 0;

  const handleChangePassword = async () => {
    if (!pwValid || savingPw) return;
    setSavingPw(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwords.old,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm,
      });
      triggerToast("Password updated successfully!", true);
      localStorage.setItem("mustChangePWD", JSON.stringify(false));
      setPasswords({ old: "", new: "", confirm: "" });
      onPasswordChanged?.();
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Error updating password"), false);
    } finally {
      setSavingPw(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await api.post("/auth/logout-all");
    } catch {
      // Proceed with local logout even if the network call fails.
    }
    localStorage.removeItem("jwtToken");
    sessionStorage.removeItem("jwtToken");
    localStorage.removeItem("mustChangePWD");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Change password */}
      <Card
        title="Password"
        subtitle="Change the password you use to sign in"
        icon={faShieldAlt}
        footer={
          <Button
            accentColor="var(--color-app-green)"
            ripple
            className="w-full sm:w-56"
            onClick={handleChangePassword}
            disabled={!pwValid || savingPw}
          >
            <FontAwesomeIcon
              icon={savingPw ? faSpinner : faKey}
              spin={savingPw}
            />
            {savingPw ? "Updating…" : "Update password"}
          </Button>
        }
      >
        {forced && (
          <div className="mb-5 flex items-start gap-3 rounded-[var(--r-input)] border border-app-yellow/30 bg-app-yellow/10 p-4">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="mt-0.5 shrink-0 text-app-yellow"
            />
            <div>
              <p className="text-sm font-bold text-app-text">
                Password change required
              </p>
              <p className="mt-0.5 text-xs text-app-muted">
                For security, set a new password before continuing to the app.
              </p>
            </div>
          </div>
        )}

        <PasswordInput
          label="Current password"
          placeholder="Enter current password"
          value={passwords.old}
          icon={faKey}
          onChange={(val) => setPasswords((p) => ({ ...p, old: val }))}
        />

        <hr className="my-5 h-px border-0 bg-app-border" />

        <div className="relative space-y-4">
          {/* Floating popover above the fields: shown only while typing a new
              password and absolutely positioned, so it never changes the card
              height (no layout shift when it appears/disappears). */}
          {passwords.new.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-[var(--r-input)] border border-app-border bg-app-card p-3 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)]">
              <PasswordRequirements
                password={passwords.new}
                confirmPassword={passwords.confirm}
              />
            </div>
          )}

          <PasswordInput
            label="New password"
            placeholder="Enter new password"
            value={passwords.new}
            icon={faLock}
            onChange={(val) => setPasswords((p) => ({ ...p, new: val }))}
          />
          <PasswordInput
            label="Confirm new password"
            placeholder="Confirm new password"
            value={passwords.confirm}
            icon={faLock}
            onChange={(val) => setPasswords((p) => ({ ...p, confirm: val }))}
          />
        </div>
      </Card>

      {/* Two-factor authentication */}
      <Card
        title="Two-factor authentication"
        subtitle="Add a second step when signing in"
        icon={faFingerprint}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MfaMethod
            icon={faFingerprint}
            title="Passkey"
            description="Sign in with a device passkey or biometrics (WebAuthn). The most phishing-resistant option."
            recommended
          />
          <MfaMethod
            icon={faQrcode}
            title="Authenticator app"
            description="Scan a QR code and enter a rotating 6-digit code from an app like Authy or Google Authenticator (TOTP)."
          />
          <MfaMethod
            icon={faEnvelope}
            title="Email code"
            description="Receive a one-time code by email at each sign-in. The simplest, but the weakest factor."
          />
        </div>
      </Card>

      {/* Sign out everywhere */}
      <Card
        tone="danger"
        title="Sign out from all devices"
        icon={faRightFromBracket}
        description="Ends every active session on all devices and browsers. You'll need to sign in again everywhere."
        footer={
          <Button
            variant="danger"
            className="w-full sm:w-56"
            onClick={() => setConfirmingAll(true)}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            Sign out everywhere
          </Button>
        }
      />

      <ConfirmModal
        open={confirmingAll}
        tone="danger"
        title="Sign out everywhere?"
        message="This ends every active session on all your devices and browsers. You'll need to sign in again everywhere."
        confirmLabel="Sign out everywhere"
        busy={signingOut}
        onConfirm={handleSignOutAll}
        onCancel={() => setConfirmingAll(false)}
      />
    </div>
  );
};
