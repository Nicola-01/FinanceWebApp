import React from "react";
import { ChevronRight } from "lucide-react";
import Button from "../../ui/Button";
import { WalletHeroCard } from "../../ui/WalletHeroCard";

interface HeroV2Props {
  ctaLabel: string;
  demoLoading: boolean;
  onPrimaryCta: () => void;
}

const scrollToBenefits = () =>
  document.getElementById("what")?.scrollIntoView({ behavior: "smooth" });

/** UI v2 hero: promise on the left, the real wallet card with example figures on the right. */
const HeroV2: React.FC<HeroV2Props> = ({
  ctaLabel,
  demoLoading,
  onPrimaryCta,
}) => (
  <header
    id="hero"
    className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pt-28 lg:pb-24"
  >
    <div>
      <p className="mb-4 flex items-center gap-2 text-[13px] font-semibold text-app-muted">
        <span className="h-2 w-2 rounded-full bg-wallet" aria-hidden="true" />
        Open-source personal finance
      </p>
      <h1 className="font-display text-[44px] leading-[1.02] font-bold tracking-[-0.045em] text-app-text lg:max-w-[13ch] lg:text-[96px] lg:leading-[0.98]">
        Know where every euro goes. Keep more.
      </h1>
      <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-app-muted lg:text-lg">
        FinanceWebApp is a free, open-source money app. Shared wallets, budgets,
        subscriptions, investments and an AI assistant, in one place.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          size="lg"
          ripple
          disabled={demoLoading}
          onClick={onPrimaryCta}
        >
          {demoLoading ? "Loading..." : ctaLabel}
          {!demoLoading && <ChevronRight className="h-5 w-5" />}
        </Button>
        <Button variant="secondary" size="lg" onClick={scrollToBenefits}>
          See how it works
        </Button>
      </div>
    </div>

    <div>
      <WalletHeroCard
        color="#8b5cf6"
        name="Main Account"
        meta="EUR · Owner"
        label="Kept this month"
        value={<span className="tabular-nums">+€412</span>}
        footer={
          <svg
            className="h-[70px] w-full"
            viewBox="0 0 300 70"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 58 C30 50 52 60 80 44 S130 38 160 42 S220 20 250 28 S290 14 300 12 L300 70 L0 70 Z"
              fill="currentColor"
              opacity=".16"
            />
            <path
              d="M0 58 C30 50 52 60 80 44 S130 38 160 42 S220 20 250 28 S290 14 300 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        }
      />
      <p className="mt-3 text-xs text-app-faint">
        Example figures, for illustration only.
      </p>
    </div>
  </header>
);

export default HeroV2;
