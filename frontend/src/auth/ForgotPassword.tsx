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
import { AnimateBackground } from "./AnimateBackground.tsx";

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
      } catch (err: any) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        triggerToast(
          err.response?.data?.title || "Failed to send reset email.",
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
    } catch (err: any) {
      triggerToast(
        err.response?.data?.title || "Failed to resend reset email.",
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
    <div className="relative flex min-h-[100dvh] items-start pt-[8dvh] sm:items-center sm:pt-0 justify-center overflow-x-hidden overflow-y-auto theme-bg-page px-4 sm:px-0 pb-8 sm:pb-0">
      <AnimateBackground />

      <div
        className={`relative z-10 flex w-full max-w-[420px] flex-col items-center rounded-3xl border border-app-border bg-app-input px-8 py-10 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
      >
        {/* Icon Header */}
        <div className="mb-6">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] transition-all duration-500 ${emailSent ? "bg-gradient-to-tr from-[#00c853]/20 to-[#00e676]/20 border border-[#00e676]/30" : "bg-app-input"}`}
          >
            <FontAwesomeIcon
              icon={emailSent ? faCircleCheck : faEnvelope}
              className={`text-3xl transition-all duration-500 ${emailSent ? "text-[#00e676]" : "theme-text-muted"}`}
            />
          </div>
        </div>

        {!emailSent ? (
          /* ========== EMAIL INPUT STATE ========== */
          <>
            <h2 className="mb-2 text-xl font-bold tracking-wide theme-text-default text-center">
              Forgot Password?
            </h2>
            <p className="mb-8 text-sm text-app-muted text-center leading-relaxed">
              Enter the email address associated with your account and we'll
              send you a link to reset your password.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col w-full"
              noValidate
            >
              {/* Email Input */}
              <div className="relative mb-8 w-full">
                <div className="relative flex items-center border-b pb-1 border-app-border0 focus-within:theme-border-active transition-colors duration-300">
                  <span className="absolute left-0 text-lg theme-text-muted">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </span>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-none theme-bg-transparent py-2 pl-8 theme-text-default placeholder-white/70 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-app-purple to-app-blue py-3 font-semibold tracking-wider theme-text-default shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="mr-2 animate-spin"
                    />
                    SENDING...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                    SEND RESET LINK
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* ========== EMAIL SENT / CONFIRMATION STATE ========== */
          <>
            <h2 className="mb-2 text-xl font-bold tracking-wide theme-text-default text-center">
              Check your email
            </h2>
            <p className="mb-2 text-sm text-app-muted text-center leading-relaxed">
              We've sent a password reset link to
            </p>
            <p className="mb-6 text-sm font-semibold theme-text-default text-center break-all">
              {email}
            </p>

            <div className="w-full rounded-xl border border-app-border theme-bg-overlay-light p-5 mb-6 shadow-inner">
              <p className="text-xs text-app-muted text-center leading-relaxed">
                Didn't receive the email? Check your spam folder, or click the
                button below to resend. The link is valid for{" "}
                <strong className="theme-text-muted">1 hour</strong>.
              </p>
            </div>

            {/* Resend Button with Cooldown */}
            <button
              type="button"
              disabled={loading || cooldown > 0}
              onClick={handleResend}
              className="w-full rounded-full bg-gradient-to-r from-app-purple to-app-blue py-3 font-semibold tracking-wider theme-text-default shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="mr-2 animate-spin"
                  />
                  SENDING...
                </>
              ) : cooldown > 0 ? (
                <>RESEND IN {formatCooldown(cooldown)}</>
              ) : (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  RESEND EMAIL
                </>
              )}
            </button>
          </>
        )}

        {/* Back to Login */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-6 flex items-center gap-2 text-sm text-app-muted transition-colors hover:theme-text-default theme-bg-transparent border-none cursor-pointer"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
