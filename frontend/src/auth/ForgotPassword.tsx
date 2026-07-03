import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faArrowLeft,
  faSpinner,
  faCircleCheck,
  faPaperPlane,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const COOLDOWN_SECONDS = 60;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  // States
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Send reset email
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Validate email
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
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
        setShake(true);
        setTimeout(() => setShake(false), 500);
        triggerToast(
          getApiErrorTitle(err, "Failed to send reset email."),
          false,
        );
      } finally {
        setLoading(false);
      }
    },
    [email],
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
  }, [email, cooldown]);

  // Format cooldown as MM:SS
  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`relative z-10 flex w-full max-w-[400px] flex-col rounded-[var(--r-card)] border border-white/10 bg-[rgba(23,18,38,0.55)] p-7 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-9 ${
        shake ? "animate-[shake_0.5s_ease-in-out]" : ""
      }`}
    >
      {/* Brand lockup */}
      <div className="mb-6 flex items-center gap-2.5">
        <img
          src="/icon.svg"
          alt="Finance"
          className="h-11 w-11 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
        />
        <span className="text-xl font-bold tracking-tight text-app-text">
          Finance
        </span>
      </div>

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
        <>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--r-card)] bg-app-green/15 text-app-green">
            <FontAwesomeIcon icon={faCircleCheck} className="text-2xl" />
          </div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
            Check your email
          </h1>
          <p className="mb-1 text-sm text-app-muted">
            We've sent a password reset link to
          </p>
          <p className="mb-5 break-all text-sm font-semibold text-app-text">
            {email}
          </p>

          <div className="mb-6 rounded-[var(--r-input)] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs leading-relaxed text-app-muted">
              Didn't get it? Check your spam folder, or resend below. The link
              is valid for <strong className="text-app-text">1 hour</strong>.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            ripple
            disabled={loading || cooldown > 0}
            onClick={handleResend}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Sending…
              </>
            ) : cooldown > 0 ? (
              <>Resend in {formatCooldown(cooldown)}</>
            ) : (
              <>
                <FontAwesomeIcon icon={faRotateRight} />
                Resend email
              </>
            )}
          </Button>
        </>
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
    </div>
  );
};

export default ForgotPassword;
