import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faTriangleExclamation,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError";
import { setMustChangePWD, setToken } from "../utils/authHelper";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Checkbox } from "../components/ui/Checkbox";
import { AUTH_GLASS_CARD, shakeClass } from "./authCardClass";
import { AUTH_CARD_V2 } from "./AuthCard";
import { AuthBrandLockup, AuthHeading, AuthSubtitle } from "./AuthBrandLockup";
import { useUiVersion } from "../hooks/useUiVersion";
import { PasswordVisibilityToggle } from "./PasswordVisibilityToggle";
import { useShake } from "./useShake";

interface Requirements {
  username?: string;
  password?: string;
}

export const LoginForm: React.FC = () => {
  // Input references
  const username = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);

  // Component states
  const [loading, setLoading] = useState(false);
  const [require, setRequire] = useState<Requirements>({});
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const { shake, triggerShake, clearShake } = useShake();
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from a protected page (e.g., OAuth consent), go back after login
  const returnTo: string =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearShake();

    const requirements: Requirements = {};
    let isValid = true;

    // Validation
    if (!username.current?.value) {
      requirements.username = "Username is required";
      isValid = false;
    }

    if (!password.current?.value) {
      requirements.password = "Password is required";
      isValid = false;
    }

    setRequire(requirements);

    // If validation fails, trigger shake animation and abort
    if (!isValid) {
      setLoading(false);
      triggerShake();
      return;
    }

    // API Call
    try {
      const response = await api.post("/auth/login", {
        username: username.current?.value,
        password: password.current?.value,
        rememberMe: remember,
      });

      const { token, passwordMustChange } = response.data;

      setMustChangePWD(passwordMustChange);

      // Store token based on 'Remember Me' preference
      setToken(token, remember);

      navigate(returnTo);
    } catch (err: unknown) {
      // Error handling & shake animation
      triggerShake();

      const title = getApiErrorTitle(err, "Connection Error.");
      triggerToast(title, false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        v2
          ? "relative z-10 flex w-full max-w-[400px] flex-col gap-4"
          : "relative z-10 flex w-full max-w-[400px] flex-col"
      }
    >
      <form
        // v2: the form gap (gap-4) spaces the fields; [&>div]:mb-0 drops the v1 field margins.
        className={
          v2
            ? `${AUTH_CARD_V2} gap-4 [&>div]:mb-0 ${shakeClass(shake)}`
            : `flex w-full flex-col ${AUTH_GLASS_CARD} ${shakeClass(shake)}`
        }
        onSubmit={handleSubmit}
        noValidate
      >
        <AuthBrandLockup />

        <AuthHeading>Welcome back</AuthHeading>
        <AuthSubtitle>Sign in to your financial workspace</AuthSubtitle>

        {/* Username Input */}
        <div className="relative mb-6">
          <Input
            ref={username}
            type="text"
            placeholder="Username"
            aria-label="Username"
            autoComplete="username"
            invalid={!!require.username}
            leadingIcon={<FontAwesomeIcon icon={faUser} />}
          />
          {require.username && (
            <span
              className={
                v2
                  ? "mt-1.5 flex items-center gap-1.5 text-[13px] text-app-danger"
                  : "absolute -bottom-5 left-1 flex items-center gap-1.5 text-xs text-app-red"
              }
            >
              <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
              {require.username}
            </span>
          )}
        </div>

        {/* Password Input */}
        <div className="relative mb-6">
          <Input
            ref={password}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            invalid={!!require.password}
            leadingIcon={<FontAwesomeIcon icon={faLock} />}
            rightSlot={
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
            }
          />
          {require.password && (
            <span
              className={
                v2
                  ? "mt-1.5 flex items-center gap-1.5 text-[13px] text-app-danger"
                  : "absolute -bottom-5 left-1 flex items-center gap-1.5 text-xs text-app-red"
              }
            >
              <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
              {require.password}
            </span>
          )}
        </div>

        {/* Remember me */}
        <div className="mb-6 text-sm">
          <Checkbox
            state={remember}
            onChange={() => setRemember(!remember)}
            size="sm"
            label="Remember me"
            aria-label="Remember me"
          />
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          ripple
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Forgot password — below the card, right-aligned */}
      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        className={
          v2
            ? "cursor-pointer self-end border-none bg-transparent text-[13px] text-app-muted underline-offset-4 transition-colors hover:text-app-text hover:underline"
            : "mt-4 cursor-pointer self-end border-none bg-transparent text-sm font-medium text-app-muted transition-colors hover:text-app-text hover:underline"
        }
      >
        Forgot password?
      </button>
    </div>
  );
};
