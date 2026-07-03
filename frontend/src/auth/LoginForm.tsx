import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faLock,
  faTriangleExclamation,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import Toggle from "../components/ui/Toggle";

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
  const [error, setError] = useState("");
  const [require, setRequire] = useState<Requirements>({});
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

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
    setError("");

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
      setError("shake");
      setTimeout(() => setError(""), 500);
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

      localStorage.setItem("mustChangePWD", JSON.stringify(passwordMustChange));

      // Store token based on 'Remember Me' preference
      if (remember) localStorage.setItem("jwtToken", token);
      else sessionStorage.setItem("jwtToken", token);

      navigate(returnTo);
    } catch (err: unknown) {
      // Error handling & shake animation
      setError("shake");
      setTimeout(() => setError(""), 500);

      const title = getApiErrorTitle(err, "Connection Error.");
      triggerToast(title, false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex w-full max-w-[400px] flex-col">
      <form
        className={`flex w-full flex-col rounded-[var(--r-card)] border border-white/10 bg-[rgba(23,18,38,0.55)] p-7 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-9 ${
          error ? "animate-[shake_0.5s_ease-in-out]" : ""
        }`}
        onSubmit={handleSubmit}
        noValidate
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

        <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
          Welcome back
        </h1>
        <p className="mb-7 text-sm text-app-muted">
          Sign in to your financial workspace
        </p>

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
            <span className="absolute -bottom-5 left-1 flex items-center gap-1.5 text-xs text-app-red">
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
          {require.password && (
            <span className="absolute -bottom-5 left-1 flex items-center gap-1.5 text-xs text-app-red">
              <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
              {require.password}
            </span>
          )}
        </div>

        {/* Remember me */}
        <div className="mb-6 text-sm">
          <Toggle
            checked={remember}
            onChange={setRemember}
            size="sm"
            label="Remember me"
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
        className="mt-4 cursor-pointer self-end border-none bg-transparent text-sm font-medium text-app-muted transition-colors hover:text-app-text hover:underline"
      >
        Forgot password?
      </button>
    </div>
  );
};
