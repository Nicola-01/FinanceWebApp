import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPen,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { AccountRow } from "./AccountRow";
import { IconAction } from "./IconAction";
import { OtpInput } from "./OtpInput";
import { useEmailChange } from "./useEmailChange";

/** Email row — masked; change requires double OTP verification. */
export const EmailChangeRow: React.FC<{
  email: string | null | undefined;
  onUpdated: (email: string | null) => void;
}> = ({ email, onUpdated }) => {
  const {
    emailStep,
    newEmail,
    setNewEmail,
    currentEmailCode,
    setCurrentEmailCode,
    newEmailCode,
    setNewEmailCode,
    emailBusy,
    resetEmailFlow,
    startEditEmail,
    requestEmailChange,
    confirmEmailChange,
    cancelPendingEmailChange,
  } = useEmailChange(onUpdated);

  if (emailStep === "idle") {
    return (
      <AccountRow label="Email" icon={faEnvelope}>
        <span className="truncate text-sm font-semibold text-app-text">
          {email ?? "—"}
        </span>
        <IconAction
          icon={faPen}
          onClick={startEditEmail}
          label="Change email"
        />
      </AccountRow>
    );
  }

  return (
    <div className="bg-app-input px-4 py-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-app-muted">
          <FontAwesomeIcon icon={faEnvelope} className="w-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Email
          </span>
        </div>

        {emailStep === "request" ? (
          <>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              className="text-sm"
              autoFocus
              disabled={emailBusy}
              onKeyDown={(e) => e.key === "Enter" && requestEmailChange()}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={requestEmailChange}
                disabled={emailBusy || !newEmail.trim()}
              >
                {emailBusy && <FontAwesomeIcon icon={faSpinner} spin />}
                Send codes
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={resetEmailFlow}
                disabled={emailBusy}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-app-muted">
              We sent a 6-digit code to your current and your new email address.
            </p>
            <OtpInput
              label="Code from current email"
              value={currentEmailCode}
              onChange={setCurrentEmailCode}
              autoFocus
              disabled={emailBusy}
            />
            <OtpInput
              label="Code from new email"
              value={newEmailCode}
              onChange={setNewEmailCode}
              disabled={emailBusy}
              onEnter={confirmEmailChange}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={confirmEmailChange}
                disabled={
                  emailBusy ||
                  currentEmailCode.trim().length !== 6 ||
                  newEmailCode.trim().length !== 6
                }
              >
                {emailBusy && <FontAwesomeIcon icon={faSpinner} spin />}
                Confirm
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={cancelPendingEmailChange}
                disabled={emailBusy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={requestEmailChange}
                disabled={emailBusy}
              >
                Resend codes
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
