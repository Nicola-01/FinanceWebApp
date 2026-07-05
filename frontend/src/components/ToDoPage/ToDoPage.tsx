import React from "react";

import BackgroundBlobs from "../LandingPage/BackgroundBlobs";
import Navbar from "../LandingPage/Navbar";
import Footer from "../LandingPage/Footer";
import { useLandingCta } from "../LandingPage/useLandingCta";
import ToDoList from "./ToDoList";

const ToDoPage: React.FC = () => {
  const { navCtaLabel, onPrimaryCta } = useLandingCta();

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
