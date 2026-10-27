import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faLock,
  faShieldAlt,
  faTriangleExclamation,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { triggerToast } from "../../components/ui/ToastNotification";
import { PasswordInput } from "../../modals/auth/PasswordInput";
import { PasswordRequirements } from "../../components/password/PasswordRequirements";
import { isPasswordValid } from "../../components/password/passwordRequirements";
import { getApiErrorDetail } from "../../utils/apiError";
import { setMustChangePWD } from "../../utils/authHelper";

interface Props {
  /** Forced (mustChangePWD) mode: show a blocking banner on the password card. */
  forced: boolean;
  /** Called after a successful password change (clears the forced state). */
  onPasswordChanged?: () => void;
}

export const ChangePasswordCard: React.FC<Props> = ({
  forced,
  onPasswordChanged,
}) => {
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

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
      setMustChangePWD(false);
      setPasswords({ old: "", new: "", confirm: "" });
      onPasswordChanged?.();
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Error updating password"), false);
    } finally {
      setSavingPw(false);
    }
  };

  return (
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
  );
};
