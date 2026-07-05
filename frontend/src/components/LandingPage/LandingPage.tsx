import React from "react";

import BackgroundSpheres from "./BackgroundSpheres";
import Navbar from "./Navbar";
import Hero from "./Hero";
import ProblemBand from "./ProblemBand";
import Features from "./Features";
import McpSection from "./McpSection";
import OpenBankingSection from "./OpenBankingSection";
import RoadmapSection from "./RoadmapSection";
import CTASection from "./CTASection";
import Footer from "./Footer";
import { useLandingCta } from "./useLandingCta";

const LandingPage: React.FC = () => {
  const {
    isLoggedIn,
    demoEnabled,
    demoLoading,
    ctaLabel,
    navCtaLabel,
    onPrimaryCta,
  } = useLandingCta();

  return (
    <div className="relative isolate bg-app-bg min-h-screen text-app-text font-sans overflow-x-hidden selection:bg-app-purple/30">
      <BackgroundSpheres />

      <Navbar ctaLabel={navCtaLabel} onPrimaryCta={onPrimaryCta} />

      <Hero
        ctaLabel={ctaLabel}
        demoLoading={demoLoading}
        onPrimaryCta={onPrimaryCta}
      />

      <ProblemBand />

      <Features />

      <McpSection />

      <OpenBankingSection />

      <RoadmapSection />

      <CTASection
        isLoggedIn={isLoggedIn}
        demoEnabled={demoEnabled}
        ctaLabel={ctaLabel}
        demoLoading={demoLoading}
        onPrimaryCta={onPrimaryCta}
      />

      <Footer />
    </div>
  );
};

export default LandingPage;
