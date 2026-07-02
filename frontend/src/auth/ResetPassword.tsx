import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faEye,
  faEyeSlash,
  faSpinner,
  faCircleExclamation,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { PasswordRequirements } from "../components/auth/PasswordRequirements.tsx";
import { isPasswordValid } from "../components/auth/passwordRequirements.ts";
import { AnimateBackground } from "./AnimateBackground.tsx";
import { getApiErrorTitle } from "../utils/apiError";

interface ResetInviteResponse {
  email: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // General states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<ResetInviteResponse | null>(
    null,
  );

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError("No reset token provided in the URL.");
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/reset-password/${token}`);
        setInviteData(res.data);

        if (res.data.status !== "FORGOTPASSWORD") {
          setError("This reset link has already been used.");
        }
      } catch (err: unknown) {
        setError(getApiErrorTitle(err, "Invalid or expired reset link."));
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Derived validation
  const isFormValid = isPasswordValid(password, confirmPassword);

  // Handle password reset
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid(password, confirmPassword)) {
      setError("shake");
      setTimeout(() => setError(""), 500);
      return triggerToast("Please meet all password requirements.", false);
    }

    setIsSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, {
        newPassword: password,
        confirmPassword: confirmPassword,
      });

      triggerToast("Password reset successfully! You can now log in.", true);
      navigate("/login");
    } catch (err: unknown) {
      setError("shake");
      setTimeout(() => setError(""), 500);
      triggerToast(getApiErrorTitle(err, "Error resetting password."), false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-start pt-[8dvh] sm:items-center sm:pt-0 justify-center overflow-x-hidden overflow-y-auto theme-bg-page px-4 sm:px-0 pb-8 sm:pb-0">
      <AnimateBackground />

      <div
        className={`relative z-10 flex w-full max-w-[420px] mx-4 flex-col items-center rounded-3xl border border-app-border bg-app-input px-8 py-10 shadow-2xl backdrop-blur-xl transition-transform duration-300 ${error === "shake" ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
      >
        {/* Icon Header */}
        <div className="mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-app-input shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]">
            <FontAwesomeIcon
              icon={faShieldHalved}
              className="text-3xl theme-text-muted"
            />
          </div>
        </div>

        {/* STATE 1: LOADING */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 text-app-muted gap-4">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-4xl text-app-blue"
            />
            <p>Verifying reset link...</p>
          </div>
        ) : /* STATE 2: ERROR */
        error && error !== "shake" ? (
          <div className="flex flex-col items-center text-center py-6 w-full">
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className="text-5xl theme-text-danger mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            />
            <h3 className="text-xl font-bold mb-2 theme-text-default">
              Reset Failed
            </h3>
            <p className="text-app-muted text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full rounded-full bg-app-hover py-3 font-semibold tracking-wider theme-text-default transition-colors hover:bg-white/20"
            >
              Back to Login
            </button>
          </div>
        ) : (
          /* STATE 3: RESET FORM */
          <form
            onSubmit={handleReset}
            className="flex flex-col w-full"
            noValidate
          >
            <h2 className="mb-2 text-xl font-bold tracking-wide theme-text-default text-center">
              Reset Password
            </h2>
            <p className="mb-6 text-sm text-app-muted text-center leading-relaxed">
              Enter your new password for{" "}
              <strong className="theme-text-muted">{inviteData?.email}</strong>
            </p>

            {/* Password Input */}
            <div className="relative mb-6 w-full">
              <div className="relative flex items-center border-b pb-1 border-app-border0 focus-within:theme-border-active transition-colors duration-300">
                <span className="absolute left-0 text-lg theme-text-muted">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-none theme-bg-transparent py-2 pl-8 pr-8 theme-text-default placeholder-white/70 outline-none"
                  autoFocus
                />
                <span
                  className="absolute right-0 z-20 cursor-pointer text-app-muted transition-colors hover:theme-text-default"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </span>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="relative mb-4 w-full">
              <div className="relative flex items-center border-b pb-1 border-app-border0 focus-within:theme-border-active transition-colors duration-300">
                <span className="absolute left-0 text-lg theme-text-muted">
                  <FontAwesomeIcon icon={faLock} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border-none theme-bg-transparent py-2 pl-8 pr-8 theme-text-default placeholder-white/70 outline-none"
                />
              </div>
            </div>

            {/* Password Requirements */}
            <PasswordRequirements
              password={password}
              confirmPassword={confirmPassword}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="w-full mt-2 rounded-full bg-gradient-to-r from-app-purple to-app-blue py-3 font-semibold tracking-wider theme-text-default shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                "RESET PASSWORD"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
