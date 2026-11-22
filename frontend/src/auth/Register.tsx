import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEnvelope,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { PasswordRequirements } from "../components/password/PasswordRequirements.tsx";
import { isPasswordValid } from "../components/password/passwordRequirements.ts";
import { getApiErrorTitle } from "../utils/apiError";
import { AuthCard, AuthV2Page } from "./AuthCard";
import { AuthBrandLockup } from "./AuthBrandLockup";
import { AuthErrorCard } from "./AuthErrorCard";
import { PasswordVisibilityToggle } from "./PasswordVisibilityToggle";
import { useInviteToken } from "./useInviteToken";
import { AuthHeading, AuthSubtitle } from "./AuthBrandLockup";
import { useUiVersion } from "../hooks/useUiVersion";
import { useShake } from "./useShake";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  const { isLoading, error, inviteData } = useInviteToken(token, {
    endpoint: "/auth/register",
    validStatus: "PENDING",
    missingTokenMessage: "No registration token provided in the URL.",
    usedMessage: "This invitation has already been used or was revoked.",
    invalidMessage: "Invalid or expired invitation link.",
  });
  const { shake, triggerShake } = useShake();

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived flag to enable/disable the submit button
  const isFormValid =
    username.trim().length >= 3 && isPasswordValid(password, confirmPassword);

  // 2. Handle the registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation (fallback)
    if (username.trim().length < 3) {
      triggerShake();
      return triggerToast(
        "Username must be at least 3 characters long.",
        false,
      );
    }
    if (!isPasswordValid(password, confirmPassword)) {
      triggerShake();
      return triggerToast("Please meet all password requirements.", false);
    }

    setIsSubmitting(true);
    try {
      // POST /auth/register/{token}
      await api.post(`/auth/register/${token}`, {
        username: username.trim(),
        password: password,
      });

      triggerToast("Registration successful! You can now log in.", true);
      navigate("/login");
    } catch (err: unknown) {
      triggerShake();
      triggerToast(getApiErrorTitle(err, "Error during registration."), false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <>
      {/* STATE 1: LOADING */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-app-muted">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className={`text-4xl ${v2 ? "text-app-text" : "text-app-blue"}`}
          />
          <p>Verifying invitation…</p>
        </div>
      ) : /* STATE 2: TOKEN ERROR */
      error ? (
        <AuthErrorCard
          title="Registration failed"
          message={error}
          onBack={() => navigate("/login")}
        />
      ) : (
        /* STATE 3: REGISTRATION FORM */
        <form
          onSubmit={handleRegister}
          // v2: the form gap spaces the fields; [&>div]:mb-0 drops the v1 field margins.
          className={v2 ? "flex flex-col gap-4 [&>div]:mb-0" : "flex flex-col"}
          noValidate
        >
          {!v2 && (
            <>
              <AuthHeading>Create your account</AuthHeading>
              <AuthSubtitle className="mb-6">
                Complete your registration to get started.
              </AuthSubtitle>
            </>
          )}

          {/* Email (read-only) */}
          <div className="mb-4">
            <Input
              type="email"
              value={inviteData?.email || ""}
              disabled
              aria-label="Email"
              className="cursor-not-allowed text-app-muted"
              leadingIcon={<FontAwesomeIcon icon={faEnvelope} />}
            />
          </div>

          {/* Username */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Choose a username"
              aria-label="Username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leadingIcon={<FontAwesomeIcon icon={faUser} />}
              {...(v2 && {
                // ui-v2-switch: no autocorrect on the username; sans placeholder
                autoCapitalize: "none",
                autoCorrect: "off",
                spellCheck: false,
                enterKeyHint: "next",
                className: "font-sans!",
              })}
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Set a password"
              aria-label="Password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leadingIcon={<FontAwesomeIcon icon={faLock} />}
              {...(v2 && { enterKeyHint: "next", className: "font-sans!" })}
              rightSlot={
                <PasswordVisibilityToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
              }
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              aria-label="Confirm password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leadingIcon={<FontAwesomeIcon icon={faLock} />}
              {...(v2 && { enterKeyHint: "go", className: "font-sans!" })}
            />
          </div>

          {/* Password Requirements */}
          <PasswordRequirements
            password={password}
            confirmPassword={confirmPassword}
          />

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            ripple
            disabled={isSubmitting || !isFormValid}
            className={v2 ? undefined : "mt-2"}
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      )}
    </>
  );

  if (!v2)
    return (
      <AuthCard shake={shake}>
        <AuthBrandLockup />
        {content}
      </AuthCard>
    );

  // ui-v2-switch: heading and subtitle above the card; loading and error states are bare
  const formState = !isLoading && !error;
  return (
    <AuthV2Page
      shake={shake}
      bare={!formState}
      title={formState ? "Create your account" : undefined}
      subtitle={
        formState ? "Complete your registration to get started." : undefined
      }
    >
      {content}
    </AuthV2Page>
  );
};

export default Register;
