import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEnvelope,
  faEye,
  faEyeSlash,
  faSpinner,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { PasswordRequirements } from "../components/auth/PasswordRequirements.tsx";
import { isPasswordValid } from "../components/auth/passwordRequirements.ts";
import { getApiErrorTitle } from "../utils/apiError";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

interface RegisterInviteResponse {
  email: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // General states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<RegisterInviteResponse | null>(
    null,
  );

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Verify the token when the page loads
  useEffect(() => {
    if (!token) {
      setError("No registration token provided in the URL.");
      setIsLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        // GET /auth/register/{token}
        const res = await api.get(`/auth/register/${token}`);
        setInviteData(res.data);

        // If the status is not PENDING, the registration is not valid
        if (res.data.status !== "PENDING") {
          setError("This invitation has already been used or was revoked.");
        }
      } catch (err: unknown) {
        setError(getApiErrorTitle(err, "Invalid or expired invitation link."));
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Derived flag to enable/disable the submit button
  const isFormValid =
    username.trim().length >= 3 && isPasswordValid(password, confirmPassword);

  // 2. Handle the registration submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation (fallback)
    if (username.trim().length < 3) {
      setError("shake");
      setTimeout(() => setError(""), 500);
      return triggerToast(
        "Username must be at least 3 characters long.",
        false,
      );
    }
    if (!isPasswordValid(password, confirmPassword)) {
      setError("shake");
      setTimeout(() => setError(""), 500);
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
      setError("shake");
      setTimeout(() => setError(""), 500);
      triggerToast(getApiErrorTitle(err, "Error during registration."), false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`relative z-10 flex w-full max-w-[400px] flex-col rounded-[var(--r-card)] border border-white/10 bg-[rgba(23,18,38,0.55)] p-7 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-9 ${
        error === "shake" ? "animate-[shake_0.5s_ease-in-out]" : ""
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

      {/* STATE 1: LOADING */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-app-muted">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-app-blue"
          />
          <p>Verifying invitation…</p>
        </div>
      ) : /* STATE 2: TOKEN ERROR */
      error && error !== "shake" ? (
        <div className="flex w-full flex-col items-center py-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--r-card)] bg-app-red/15 text-app-red">
            <FontAwesomeIcon icon={faCircleExclamation} className="text-2xl" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-app-text">
            Registration failed
          </h2>
          <p className="mb-6 text-sm text-app-muted">{error}</p>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate("/login")}
          >
            Back to login
          </Button>
        </div>
      ) : (
        /* STATE 3: REGISTRATION FORM */
        <form onSubmit={handleRegister} className="flex flex-col" noValidate>
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
            Create your account
          </h1>
          <p className="mb-6 text-sm text-app-muted">
            Complete your registration to get started.
          </p>

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
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center rounded-md p-2 text-app-muted transition-colors hover:text-app-text"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
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
            className="mt-2"
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default Register;
