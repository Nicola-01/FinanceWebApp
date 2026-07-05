import React from "react";
import { ChevronRight } from "lucide-react";
import Button from "../ui/Button";
import GithubMark from "./GithubMark";
import { GITHUB_URL } from "./landingDemoData";

interface CTASectionProps {
  isLoggedIn: boolean;
  demoEnabled: boolean;
  ctaLabel: string;
  demoLoading: boolean;
  onPrimaryCta: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({
  isLoggedIn,
  demoEnabled,
  ctaLabel,
  demoLoading,
  onPrimaryCta,
}) => {
  const { headline, sub } = isLoggedIn
    ? {
        headline: "Welcome back.",
        sub: "Pick up right where you left off.",
      }
    : demoEnabled
      ? {
          headline: "See it for yourself.",
          sub: "Jump into a fully populated demo wallet — no sign-up, no setup.",
        }
      : {
          headline: "Ready to take control?",
          sub: "Log in to your account and get the full picture of your money.",
        };

  return (
    <section className="py-24 px-4 pb-32">
      <div className="max-w-4xl mx-auto relative flex flex-col items-center justify-center p-12 md:p-20 overflow-hidden rounded-[var(--r-card)] bg-gradient-to-t from-[var(--brand-1)]/10 to-app-bg border border-app-purple/25 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
        <h2 className="text-4xl md:text-5xl font-bold mb-5 text-app-text">
          {headline}
        </h2>
        <p className="text-xl text-app-muted mb-10 max-w-xl">{sub}</p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            ripple
            disabled={demoLoading}
            onClick={onPrimaryCta}
          >
            {demoLoading ? "Loading..." : ctaLabel}
            {!demoLoading && <ChevronRight className="w-5 h-5" />}
          </Button>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="lg">
              <GithubMark className="w-5 h-5" />
              View on GitHub
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
