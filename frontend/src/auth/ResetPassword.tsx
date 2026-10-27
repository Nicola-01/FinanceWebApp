import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faSpinner } from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { PasswordRequirements } from "../components/password/PasswordRequirements.tsx";
import { isPasswordValid } from "../components/password/passwordRequirements.ts";
import { getApiErrorTitle } from "../utils/apiError";
import { AuthCard } from "./AuthCard";
import { AuthBrandLockup } from "./AuthBrandLockup";
import { AuthErrorCard } from "./AuthErrorCard";
import { PasswordVisibilityToggle } from "./PasswordVisibilityToggle";
import { useInviteToken } from "./useInviteToken";
import { useShake } from "./useShake";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const { isLoading, error, inviteData } = useInviteToken(token, {
    endpoint: "/auth/reset-password",
    validStatus: "FORGOTPASSWORD",
    missingTokenMessage: "No reset token provided in the URL.",
    usedMessage: "This reset link has already been used.",
    invalidMessage: "Invalid or expired reset link.",
  });
  const { shake, triggerShake } = useShake();

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived validation
  const isFormValid = isPasswordValid(password, confirmPassword);

  // Handle password reset
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid(password, confirmPassword)) {
      triggerShake();
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
      triggerShake();
      triggerToast(getApiErrorTitle(err, "Error resetting password."), false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard shake={shake}>
      <AuthBrandLockup />

      {/* STATE 1: LOADING */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-app-muted">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-app-blue"
          />
          <p>Verifying reset link…</p>
        </div>
      ) : /* STATE 2: ERROR */
      error ? (
        <AuthErrorCard
          title="Reset failed"
          message={error}
          onBack={() => navigate("/login")}
        />
      ) : (
        /* STATE 3: RESET FORM */
        <form onSubmit={handleReset} className="flex flex-col" noValidate>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
            Reset password
          </h1>
          <p className="mb-6 text-sm text-app-muted">
            Set a new password for{" "}
            <strong className="text-app-text">{inviteData?.email}</strong>
          </p>

          {/* Password Requirements */}
          <PasswordRequirements
            password={password}
            confirmPassword={confirmPassword}
          />

          {/* Password Input */}
          <div className="mb-4">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              aria-label="New password"
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<FontAwesomeIcon icon={faLock} />}
              rightSlot={
                <PasswordVisibilityToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
              }
            />
          </div>

          {/* Confirm Password Input */}
          <div className="mb-4">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              aria-label="Confirm password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leadingIcon={<FontAwesomeIcon icon={faLock} />}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            ripple
            disabled={isSubmitting || !isFormValid}
            className="mt-2"
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              "Reset password"
            )}
          </Button>
        </form>
      )}
    </AuthCard>
  );
};

export default ResetPassword;
