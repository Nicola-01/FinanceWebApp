import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faArrowLeft,
  faSpinner,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { AuthBrandLockup } from "./AuthBrandLockup";
import { useShake } from "./useShake";
import { useCooldown } from "./useCooldown";
import { ForgotPasswordSent } from "./ForgotPasswordSent";

const COOLDOWN_SECONDS = 60;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  // States
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { shake, triggerShake } = useShake();
  const { cooldown, setCooldown } = useCooldown();

  // Send reset email
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Validate email
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        triggerShake();
        triggerToast("Please enter a valid email address.", false);
        return;
      }

      setLoading(true);

      try {
        await api.post("/auth/forgot-password", { email: email.trim() });
        setEmailSent(true);
        setCooldown(COOLDOWN_SECONDS);
        triggerToast("Reset email sent successfully!", true);
      } catch (err: unknown) {
        triggerShake();
        triggerToast(
          getApiErrorTitle(err, "Failed to send reset email."),
          false,
        );
      } finally {
        setLoading(false);
      }
    },
    [email, triggerShake, setCooldown],
  );

  // Resend email
  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setCooldown(COOLDOWN_SECONDS);
      triggerToast("Reset email resent successfully!", true);
    } catch (err: unknown) {
      triggerToast(
        getApiErrorTitle(err, "Failed to resend reset email."),
        false,
      );
    } finally {
      setLoading(false);
    }
  }, [email, cooldown, setCooldown]);

  return (
    <AuthCard shake={shake}>
      <AuthBrandLockup />

      {!emailSent ? (
        /* ========== EMAIL INPUT STATE ========== */
        <>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
            Forgot password?
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-app-muted">
            Enter the email associated with your account and we'll send you a
            link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
            <div className="mb-6">
              <Input
                type="email"
                placeholder="Email address"
                aria-label="Email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leadingIcon={<FontAwesomeIcon icon={faEnvelope} />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              ripple
              disabled={loading}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Send reset link
                </>
              )}
            </Button>
          </form>
        </>
      ) : (
        /* ========== EMAIL SENT / CONFIRMATION STATE ========== */
        <ForgotPasswordSent
          email={email}
          loading={loading}
          cooldown={cooldown}
          onResend={handleResend}
          onChangeEmail={() => setEmailSent(false)}
        />
      )}

      {/* Back to Login */}
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="mt-6 flex cursor-pointer items-center gap-2 self-center border-none bg-transparent text-sm text-app-muted transition-colors hover:text-app-text"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to login
      </button>
    </AuthCard>
  );
};

export default ForgotPassword;
