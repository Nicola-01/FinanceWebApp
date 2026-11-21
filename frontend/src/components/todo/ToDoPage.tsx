import React from "react";

import BackgroundBlobs from "../landing/BackgroundBlobs";
import Navbar from "../landing/Navbar";
import Footer from "../landing/Footer";
import { useLandingCta } from "../landing/useLandingCta";
import ToDoList from "./ToDoList";
import ToDoListV2 from "./ToDoListV2";
import NavbarV2 from "../landing/v2/NavbarV2";
import FooterV2 from "../landing/v2/FooterV2";
import { useUiVersion } from "../../hooks/useUiVersion";

const ToDoPage: React.FC = () => {
  const [ui] = useUiVersion(); // ui-v2-switch
  const { navCtaLabel, demoLoading, onPrimaryCta } = useLandingCta();

  // ui-v2-switch: flat theme-token page, no blobs; same copy as v1.
  if (ui === "v2") {
    return (
      <div className="min-h-screen bg-app-bg text-app-text font-sans overflow-x-hidden">
        <NavbarV2
          navCtaLabel={navCtaLabel}
          demoLoading={demoLoading}
          onPrimaryCta={onPrimaryCta}
        />
        <main className="mx-auto max-w-6xl px-4 pt-10 lg:px-8">
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-app-text sm:text-[32px]">
            Roadmap & future improvements
          </h1>
          <p className="mt-2 text-[14px] text-app-muted">
            Here's a look at what I've shipped, what I'm working on, and where
            I'm going.
          </p>
          <div className="mt-8">
            <ToDoListV2 />
          </div>
        </main>
        <FooterV2 />
      </div>
    );
  }

  return (
    <div className="bg-app-bg min-h-screen text-app-text font-sans overflow-x-hidden selection:bg-app-purple/30">
      <BackgroundBlobs />

      <Navbar ctaLabel={navCtaLabel} onPrimaryCta={onPrimaryCta} />

      <div className="relative pt-32 pb-10 px-4 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-6xl">
          Roadmap & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-1)] via-app-purple to-[var(--brand-2)]">
            Future Improvements
          </span>
        </h1>
        <p className="text-lg md:text-xl text-app-muted max-w-6xl leading-relaxed mb-8">
          Here's a look at what I've shipped, what I'm working on, and where I'm
          going.
        </p>
      </div>

      <div className="relative z-10 px-4">
        <ToDoList />
      </div>

      <Footer />
    </div>
  );
};

export default ToDoPage;
