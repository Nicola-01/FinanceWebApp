import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "./LoginForm.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask, faSpinner, faCheck } from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError";
import Button from "../components/ui/Button";

const demoEnabled = import.meta.env.VITE_DEMO_ENABLED === "true";

const DEMO_FEATURES = [
  "Pre-populated with realistic sample data",
  "Full access to all the features",
  "Completely private, safe workspace",
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);

  // Clear tokens on component mount to ensure user is truly logged out
  useEffect(() => {
    localStorage.removeItem("jwtToken");
    sessionStorage.removeItem("jwtToken");
    localStorage.removeItem("mustChangePWD");
  }, []);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const response = await api.post("/auth/demo");
      const { token } = response.data;

      localStorage.setItem("mustChangePWD", JSON.stringify(false));
      sessionStorage.setItem("jwtToken", token);

      navigate("/");
    } catch (err: unknown) {
      const title = getApiErrorTitle(err, "Could not create demo account.");
      triggerToast(title, false);
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    // The dark shell + animated background live in AuthLayout; this renders
    // only the card so the background persists across auth navigation.
    <div
      className={`relative z-10 flex w-full flex-col items-center gap-6 ${
        demoEnabled ? "max-w-[420px]" : "max-w-[400px]"
      }`}
    >
      {/* Conditionally Render Form vs Demo Card */}
      {!demoEnabled ? (
        <LoginForm />
      ) : (
        <div className="flex w-full flex-col items-center rounded-[var(--r-card)] border border-white/10 bg-[rgba(23,18,38,0.55)] p-8 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-10">
          {/* Brand lockup */}
          <div className="mb-6 flex items-center gap-2.5 self-start">
            <img
              src="/icon.svg"
              alt="Finance"
              className="h-10 w-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
            />
            <span className="text-lg font-bold tracking-tight text-app-text">
              Finance
            </span>
          </div>

          {/* Demo Icon Header */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[var(--r-card)] bg-gradient-to-tr from-[var(--brand-1)] to-[var(--brand-2)] shadow-[0_12px_26px_-14px_rgba(0,0,0,0.7)]">
            <FontAwesomeIcon icon={faFlask} className="text-2xl text-white" />
          </div>

          <h2 className="mb-2 text-center text-2xl font-bold tracking-tight text-app-text">
            Live Demo Access
          </h2>

          {/* Detailed Description */}
          <div className="mb-8 flex flex-col items-center space-y-4 text-center text-sm text-app-muted">
            <p className="leading-relaxed">
              Experience the personal finance manager completely risk-free. No
              sign-up required.
            </p>

            {/* Feature List */}
            <ul className="w-full space-y-3 rounded-[var(--r-input)] border border-white/10 bg-white/[0.03] p-5 text-left">
              {DEMO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-2)]/15 text-[10px] font-bold text-[var(--brand-2)]">
                    <FontAwesomeIcon icon={faCheck} />
                  </span>
                  <span className="leading-tight text-app-text">{feature}</span>
                </li>
              ))}
            </ul>

            <p className="pt-1 text-xs italic text-app-muted opacity-80">
              Note: All demo data is ephemeral and will be securely erased
              daily.
            </p>
          </div>

          {/* CTA Button */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            ripple
            disabled={demoLoading}
            onClick={handleTryDemo}
          >
            {demoLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                GENERATING WORKSPACE…
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faFlask} />
                START EXPLORING NOW
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Login;
