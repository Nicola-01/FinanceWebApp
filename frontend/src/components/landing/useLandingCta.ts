import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAuth } from "../../utils/authHelper";
import api from "../../api/axiosConfig";
import { triggerToast } from "../ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

/**
 * Shared primary-CTA logic for the public pages (landing + roadmap).
 *
 * Resolves the demo/login/dashboard behaviour from the `VITE_DEMO_ENABLED`
 * flag and the auth state, and exposes the labels + handler the Navbar and the
 * page CTAs consume. When demo is enabled there is **no** login/register path.
 */
export interface LandingCta {
  isLoggedIn: boolean;
  demoEnabled: boolean;
  demoLoading: boolean;
  /** Full label for hero / closing CTAs. */
  ctaLabel: string;
  /** Compact label for the navbar. */
  navCtaLabel: string;
  onPrimaryCta: () => void;
}

export const useLandingCta = (): LandingCta => {
  const navigate = useNavigate();
  // Read at render time (not module scope) so it stays overridable in tests.
  const demoEnabled = import.meta.env.VITE_DEMO_ENABLED === "true";
  const [demoLoading, setDemoLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (getUserAuth()) setIsLoggedIn(true);
    // React Router keeps the previous scroll offset across routes; reset it so
    // a public page always opens at the top (e.g. /ToDo → Home → /about).
    window.scrollTo(0, 0);
  }, []);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const response = await api.post("/auth/demo");
      const { token } = response.data;
      localStorage.setItem("mustChangePWD", JSON.stringify(false));
      sessionStorage.setItem("jwtToken", token);
      navigate("/dashboard");
      window.location.reload(); // apply auth state
    } catch (err: unknown) {
      triggerToast(
        getApiErrorTitle(err, "Could not create demo account."),
        false,
      );
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  const onPrimaryCta = () => {
    if (isLoggedIn) navigate("/dashboard");
    else if (demoEnabled) handleTryDemo();
    else navigate("/login");
  };

  const ctaLabel = isLoggedIn
    ? "Go to dashboard"
    : demoEnabled
      ? "Launch the demo"
      : "Log in";
  const navCtaLabel = isLoggedIn
    ? "Dashboard"
    : demoEnabled
      ? "Launch demo"
      : "Log in";

  return {
    isLoggedIn,
    demoEnabled,
    demoLoading,
    ctaLabel,
    navCtaLabel,
    onPrimaryCta,
  };
};
