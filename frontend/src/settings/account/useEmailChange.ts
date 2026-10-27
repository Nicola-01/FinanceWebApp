import { useState } from "react";
import api from "../../api/axiosConfig";
import { triggerToast } from "../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../utils/apiError";

/** Steps of the double-verification email-change flow. */
export type EmailStep = "idle" | "request" | "verify";

/**
 * Double-verification email change: request (codes sent to current + new
 * address) → verify both codes → `onUpdated` with the new (masked) email.
 */
export function useEmailChange(onUpdated: (email: string | null) => void) {
  const [emailStep, setEmailStep] = useState<EmailStep>("idle");
  const [newEmail, setNewEmail] = useState("");
  const [currentEmailCode, setCurrentEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

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
      onUpdated(res.data.email);
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

  return {
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
  };
}
