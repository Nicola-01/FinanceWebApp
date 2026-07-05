import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserAuth } from "../../utils/authHelper";
import api from "../../api/axiosConfig";
import { triggerToast } from "../ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

// Sub-components
import BackgroundBlobs from "./BackgroundBlobs";
import Navbar from "./Navbar";
import Hero from "./Hero";
import DemoSection from "./DemoSection";
import Features from "./Features";
import CTASection from "./CTASection";
import ToDoSection from "./ToDoSection";
import Footer from "./Footer";

const demoEnabled = import.meta.env.VITE_DEMO_ENABLED === "true";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = getUserAuth();
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    try {
      const response = await api.post("/auth/demo");
      const { token } = response.data;
      localStorage.setItem("mustChangePWD", JSON.stringify(false));
      sessionStorage.setItem("jwtToken", token);
      navigate("/dashboard");
      window.location.reload(); // Quick refresh to apply auth state
    } catch (err: unknown) {
      const title = getApiErrorTitle(err, "Could not create demo account.");
      triggerToast(title, false);
      console.error(err);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleMainCta = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else if (demoEnabled) {
      handleTryDemo();
    } else {
      navigate("/login");
    }
  };

  const handleSecondaryCta = () => {
    navigate("/ToDo");
  };

  return (
    <div className="bg-app-bg min-h-screen text-app-text font-sans overflow-x-hidden selection:bg-app-purple/30">
      <BackgroundBlobs />

      <Navbar
        isLoggedIn={isLoggedIn}
        onDashboardClick={() => navigate("/dashboard")}
        onLoginClick={() => navigate("/login")}
      />

      <Hero
        isLoggedIn={isLoggedIn}
        demoEnabled={demoEnabled}
        demoLoading={demoLoading}
        onMainCta={handleMainCta}
        onSecondaryCta={handleSecondaryCta}
      />

      <DemoSection demoEnabled={demoEnabled} isLoggedIn={isLoggedIn} />

      <Features />

      <ToDoSection />

      <CTASection
        isLoggedIn={isLoggedIn}
        demoEnabled={demoEnabled}
        onMainCta={handleMainCta}
      />

      <Footer />
    </div>
  );
};

export default LandingPage;
