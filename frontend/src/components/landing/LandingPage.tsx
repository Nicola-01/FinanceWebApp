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
import NavbarV2 from "./v2/NavbarV2";
import HeroV2 from "./v2/HeroV2";
import ProblemBandV2 from "./v2/ProblemBandV2";
import ExampleMonthV2 from "./v2/ExampleMonthV2";
import TrustV2 from "./v2/TrustV2";
import FinalCtaV2 from "./v2/FinalCtaV2";
import FooterV2 from "./v2/FooterV2";
import LandingBenefitsV2 from "./benefits/LandingBenefitsV2";
import { useLandingCta } from "./useLandingCta";
import { useUiVersion } from "../../hooks/useUiVersion";
import { walletVars } from "../../utils/color";

// Accent of the approved mock (V1): the solid violet "wallet" surfaces.
const LANDING_ACCENT = "#8b5cf6";

const LandingPage: React.FC = () => {
  const [ui] = useUiVersion(); // ui-v2-switch
  const {
    isLoggedIn,
    demoEnabled,
    demoLoading,
    ctaLabel,
    navCtaLabel,
    onPrimaryCta,
  } = useLandingCta();

  // ui-v2-switch: the v2 landing follows the theme tokens (no blobs, no spheres).
  if (ui === "v2") {
    return (
      <div
        className="min-h-screen bg-app-bg text-app-text font-sans overflow-x-hidden selection:bg-app-purple/30"
        style={walletVars(LANDING_ACCENT)}
      >
        <NavbarV2
          navCtaLabel={navCtaLabel}
          demoLoading={demoLoading}
          onPrimaryCta={onPrimaryCta}
        />
        <HeroV2
          ctaLabel={ctaLabel}
          demoLoading={demoLoading}
          onPrimaryCta={onPrimaryCta}
        />
        <ProblemBandV2 />
        <LandingBenefitsV2 />
        <ExampleMonthV2 />
        <TrustV2 />
        <FinalCtaV2
          ctaLabel={ctaLabel}
          demoLoading={demoLoading}
          onPrimaryCta={onPrimaryCta}
        />
        <FooterV2 />
      </div>
    );
  }

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
