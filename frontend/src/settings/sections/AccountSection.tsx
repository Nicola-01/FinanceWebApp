import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faUser,
  faEnvelope,
  faIdBadge,
  faCalendarDays,
  faPen,
  faCheck,
  faXmark,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axiosConfig";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";

/** Steps of the double-verification email-change flow. */
type EmailStep = "idle" | "request" | "verify";

interface UserProfile {
  id: string;
  username: string;
  email: string | null; // masked server-side
  role: string | null;
  createdAt: string | null; // YYYY-MM-DD
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  const [, y, mo, d] = m;
  return new Date(Number(y), Number(mo) - 1, Number(d)).toLocaleDateString(
    undefined,
    { year: "numeric", month: "long", day: "numeric" },
  );
}

/** Persist a freshly-issued access token in whichever storage currently holds it. */
function storeToken(token: string) {
  const storage = localStorage.getItem("jwtToken")
    ? localStorage
    : sessionStorage;
  storage.setItem("jwtToken", token);
}

const Row: React.FC<{
  label: string;
  icon: IconDefinition;
  children: React.ReactNode;
}> = ({ label, icon, children }) => (
  <div className="flex items-center justify-between gap-4 bg-app-input px-4 py-3">
    <div className="flex shrink-0 items-center gap-3 text-app-muted">
      <FontAwesomeIcon icon={icon} className="w-4" />
      <span className="text-[11px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
      {children}
    </div>
  </div>
);

const IconAction: React.FC<{
  icon: IconDefinition;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  spin?: boolean;
  danger?: boolean;
}> = ({ icon, onClick, label, disabled, spin, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-sm transition-colors disabled:opacity-40 ${
      danger
        ? "text-app-muted hover:bg-app-hover hover:text-app-red"
        : "text-app-muted hover:bg-app-hover hover:text-app-text"
    }`}
  >
    <FontAwesomeIcon icon={icon} spin={spin} />
  </button>
);

export const AccountSection: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  // Double-verification email change: request → verify → confirm.
  const [emailStep, setEmailStep] = useState<EmailStep>("idle");
  const [newEmail, setNewEmail] = useState("");
  const [currentEmailCode, setCurrentEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/users/me");
        setProfile(res.data);
      } catch (err: unknown) {
        triggerToast(getApiErrorDetail(err, "Failed to load profile"), false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Username ───────────────────────────────────────────────────────────
  const startEditUsername = () => {
    setUsernameDraft(profile?.username ?? "");
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    const name = usernameDraft.trim();
    if (!name || name === profile?.username) {
      setEditingUsername(false);
      return;
    }
    setSavingUsername(true);
    try {
      // Backend re-issues tokens (username is the JWT subject) — store the new one.
      const res = await api.put("/users/me/username", { username: name });
      if (res.data?.token) storeToken(res.data.token);
      setProfile((p) => (p ? { ...p, username: name } : p));
      setEditingUsername(false);
      triggerToast("Username updated", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to update username"), false);
    } finally {
      setSavingUsername(false);
    }
  };

  // ─── Email (double-verification flow) ─────────────────────────────────────
  const resetEmailFlow = () => {
    setEmailStep("idle");
    setNewEmail("");
    setCurrentEmailCode("");
    setNewEmailCode("");
  };

  const startEditEmail = () => {
    setNewEmail("");
    setCurrentEmailCode("");
    setNewEmailCode("");
    setEmailStep("request");
  };

  /** Keep OTP inputs to at most 6 digits. */
  const onCodeChange =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setter(e.target.value.replace(/\D/g, "").slice(0, 6));

  // Step 1 — ask the server to send a code to both the current and new address.
  const requestEmailChange = async () => {
    const email = newEmail.trim();
    if (!email) return;
    setEmailBusy(true);
    try {
      await api.post("/users/me/email/change-request", { newEmail: email });
      setCurrentEmailCode("");
      setNewEmailCode("");
      setEmailStep("verify");
      triggerToast("Verification codes sent", true);
    } catch (err: unknown) {
      triggerToast(
        getApiErrorDetail(err, "Failed to send verification codes"),
        false,
      );
    } finally {
      setEmailBusy(false);
    }
  };

  // Step 2 — confirm both codes; the response carries the new (masked) email.
  const confirmEmailChange = async () => {
    const cur = currentEmailCode.trim();
    const next = newEmailCode.trim();
    if (cur.length !== 6 || next.length !== 6) return;
    setEmailBusy(true);
    try {
      const res = await api.post("/users/me/email/change-confirm", {
        currentEmailCode: cur,
        newEmailCode: next,
      });
      setProfile((p) => (p ? { ...p, email: res.data.email } : p));
      resetEmailFlow();
      triggerToast("Email updated", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Failed to update email"), false);
    } finally {
      setEmailBusy(false);
    }
  };

  // Cancel a pending change: clean up the server state, then reset the row.
  const cancelPendingEmailChange = async () => {
    setEmailBusy(true);
    try {
      await api.delete("/users/me/email/change");
    } catch (err: unknown) {
      triggerToast(
        getApiErrorDetail(err, "Failed to cancel email change"),
        false,
      );
    } finally {
      setEmailBusy(false);
      resetEmailFlow();
    }
  };

  return (
    <Card>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <FontAwesomeIcon icon={faSpinner} spin className="text-app-muted" />
        </div>
      ) : (
        <div className="divide-y divide-app-border overflow-hidden rounded-[var(--r-input)] border border-app-border">
          {/* Username — inline editable */}
          <Row label="Username" icon={faUser}>
            {editingUsername ? (
              <>
                <Input
                  value={usernameDraft}
                  onChange={(e) => setUsernameDraft(e.target.value)}
                  className="text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveUsername()}
                />
                <IconAction
                  icon={savingUsername ? faSpinner : faCheck}
                  spin={savingUsername}
                  onClick={saveUsername}
                  label="Save username"
                  disabled={savingUsername || !usernameDraft.trim()}
                />
                <IconAction
                  icon={faXmark}
                  onClick={() => setEditingUsername(false)}
                  label="Cancel"
                  disabled={savingUsername}
                />
              </>
            ) : (
              <>
                <span className="truncate text-sm font-semibold text-app-text">
                  {profile?.username ?? "—"}
                </span>
                <IconAction
                  icon={faPen}
                  onClick={startEditUsername}
                  label="Edit username"
                />
              </>
            )}
          </Row>

          {/* Email — masked; change requires double OTP verification */}
          {emailStep === "idle" ? (
            <Row label="Email" icon={faEnvelope}>
              <span className="truncate text-sm font-semibold text-app-text">
                {profile?.email ?? "—"}
              </span>
              <IconAction
                icon={faPen}
                onClick={startEditEmail}
                label="Change email"
              />
            </Row>
          ) : (
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
                      onKeyDown={(e) =>
                        e.key === "Enter" && requestEmailChange()
                      }
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
                      We sent a 6-digit code to your current and your new email
                      address.
                    </p>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-app-muted">
                        Code from current email
                      </label>
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        value={currentEmailCode}
                        onChange={onCodeChange(setCurrentEmailCode)}
                        placeholder="000000"
                        className="text-sm tracking-[0.3em]"
                        autoFocus
                        disabled={emailBusy}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-app-muted">
                        Code from new email
                      </label>
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        value={newEmailCode}
                        onChange={onCodeChange(setNewEmailCode)}
                        placeholder="000000"
                        className="text-sm tracking-[0.3em]"
                        disabled={emailBusy}
                        onKeyDown={(e) =>
                          e.key === "Enter" && confirmEmailChange()
                        }
                      />
                    </div>
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
          )}

          {/* Role — shown only for admins */}
          {profile?.role === "ADMIN" && (
            <Row label="Role" icon={faIdBadge}>
              <span className="rounded bg-app-yellow/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-app-yellow">
                Admin
              </span>
            </Row>
          )}

          {/* Member since */}
          <Row label="Member since" icon={faCalendarDays}>
            <span className="text-sm font-medium text-app-text">
              {formatDate(profile?.createdAt)}
            </span>
          </Row>
        </div>
      )}
    </Card>
  );
};
