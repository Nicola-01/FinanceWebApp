import React from "react";
import { ChevronRight } from "lucide-react";

interface HeroProps {
  isLoggedIn: boolean;
  demoEnabled: boolean;
  demoLoading: boolean;
  onMainCta: () => void;
  onSecondaryCta: () => void;
}

const Hero: React.FC<HeroProps> = ({
  isLoggedIn,
  demoEnabled,
  demoLoading,
  onMainCta,
  onSecondaryCta,
}) => {
  return (
    <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
        Own Your Wealth. <br className="hidden md:block" />
        Control Your Money with{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-1)] via-app-purple to-[var(--brand-2)]">
          Absolute Precision.
        </span>
      </h1>
      <p className="text-lg md:text-xl text-app-muted mb-10 max-w-2xl leading-relaxed">
        A personal side project, a full-stack finance hub I built to track
        multi-currency wallets, collaborative budgets, and detailed analytics
        with complete transparency.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onMainCta}
          disabled={demoLoading}
          className="bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white font-semibold py-4 px-8 rounded-full shadow-[0_12px_26px_-14px_rgba(0,0,0,0.7)] hover:shadow-[0_18px_38px_-16px_rgba(0,0,0,0.85)] hover:-translate-y-1 hover:brightness-[1.07] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {demoLoading
            ? "Loading..."
            : isLoggedIn
              ? "Go to Dashboard"
              : demoEnabled
                ? "Enter Demo Wallet"
                : "Get Started"}
          {!demoLoading && <ChevronRight className="w-5 h-5" />}
        </button>
        {!isLoggedIn && (
          <button
            onClick={onSecondaryCta}
            className="bg-app-input border border-app-border hover:bg-app-hover font-semibold py-4 px-8 rounded-full transition-all duration-300"
          >
            See What's Coming
          </button>
        )}
      </div>

      {/* Hero Mockup Graphic */}
      <div className="mt-16 md:mt-24 w-full max-w-5xl relative hidden sm:flex justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/60 to-transparent z-10 w-full h-[120%] bottom-[-20%]"></div>
        <div className="backdrop-blur-xl bg-app-input border border-app-border rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row p-6 gap-6 items-start transform perspective-1000 rotate-x-12 scale-95 border-b-0 rounded-b-none w-full max-w-4xl">
          {/* Abstract placeholder for the dashboard UI */}

          <div className="flex flex-col gap-4 w-full md:w-1/3">
            {/* Selected Wallet */}
            <div className="bg-app-hover rounded-xl p-4 border border-app-purple/30 hidden md:block transition-all">
              <div className="flex justify-between items-center mb-4">
                <div className="h-4 w-1/2 bg-white/20 rounded"></div>
              </div>
              <div className="h-24 bg-gradient-to-br from-[var(--brand-1)]/25 to-[var(--brand-2)]/25 rounded-lg mb-4"></div>
            </div>

            {/* Unselected Wallet */}
            <div className="bg-app-input rounded-xl p-4 border border-app-border hidden md:block opacity-40 hover:opacity-60 transition-opacity">
              <div className="h-4 w-1/2 bg-app-hover rounded mb-4"></div>
              <div className="h-24 bg-gradient-to-br from-[var(--brand-1)]/25 to-[var(--brand-2)]/25 rounded-lg mb-2"></div>
            </div>
          </div>

          <div className="w-full md:w-2/3 bg-app-input rounded-xl p-4 border border-app-border">
            <div className="flex justify-between mb-4">
              <div className="h-4 w-1/4 bg-app-hover rounded"></div>
              <div className="h-4 w-1/4 bg-app-green/20 rounded"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-app-input rounded flex items-center px-4 justify-between border border-app-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-app-purple/20"></div>
                    <div className="h-3 w-20 bg-app-hover rounded"></div>
                  </div>
                  <div className="h-3 w-12 bg-app-hover rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Hero;
