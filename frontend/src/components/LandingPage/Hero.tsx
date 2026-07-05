import React from "react";
import { ChevronRight } from "lucide-react";
import Button from "../ui/Button";
import { WalletCardUI } from "../../dashboard/wallet/WalletCard";
import MockTransactionRow from "./MockTransactionRow";
import { DEMO_TRANSACTIONS, DEMO_WALLETS } from "./landingDemoData";

interface HeroProps {
  ctaLabel: string;
  demoLoading: boolean;
  onPrimaryCta: () => void;
}

const heroRows = DEMO_TRANSACTIONS.slice(0, 5);

const Hero: React.FC<HeroProps> = ({ ctaLabel, demoLoading, onPrimaryCta }) => {
  const scrollToFeatures = () =>
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });

  return (
    <header
      id="hero"
      className="relative pt-32 pb-16 md:pt-44 md:pb-24 px-4 max-w-7xl mx-auto flex flex-col items-center text-center scroll-mt-24"
    >
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-app-border bg-app-input/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-app-muted">
        Open-source personal finance
      </span>

      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-app-text">
        Your small expenses{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-1)] via-app-purple to-[var(--brand-2)]">
          aren't small.
        </span>
      </h1>

      <p className="text-lg md:text-xl text-app-muted mb-10 max-w-2xl leading-relaxed">
        A coffee here, a subscription there — on their own they're nothing.
        Together they're your month. FinanceWebApp turns every little
        transaction into a picture you can actually act on. Built solo, in the
        open, always improving.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
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
        <Button variant="secondary" size="lg" onClick={scrollToFeatures}>
          See the features
        </Button>
      </div>

      {/* ── Faithful dashboard mockup (non-interactive) ─────────────── */}
      <div className="mt-16 md:mt-24 w-full max-w-4xl relative hidden sm:flex justify-center">
        <div
          className="relative pointer-events-none select-none text-left backdrop-blur-xl bg-app-surface/50 border border-app-border border-b-0 rounded-[var(--r-card)] rounded-b-none shadow-[0_20px_60px_-24px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col md:flex-row p-5 gap-5 items-stretch w-full"
          aria-hidden="true"
        >
          {/* Wallet column — real WalletCardUI */}
          <div className="flex flex-col gap-3 w-full md:w-[280px] shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-app-muted text-left px-1">
              Wallets
            </p>
            <WalletCardUI wallet={DEMO_WALLETS[0]} isSelected />
            <WalletCardUI wallet={DEMO_WALLETS[1]} isSelected={false} />
          </div>

          {/* Transactions — real TransactionRow */}
          <div className="w-full flex flex-col gap-2 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-app-muted px-1">
              Recent transactions
            </p>
            {heroRows.map((tx, i) => (
              <MockTransactionRow
                key={tx.id}
                transaction={tx}
                isFirst={i === 0}
                isLast={i === heroRows.length - 1}
              />
            ))}
          </div>

          {/* Bottom fade — inside the panel, so it's clipped to the exact
              same box + rounded corners (no oversized overlay on top). */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-app-bg to-transparent" />
        </div>
      </div>
    </header>
  );
};

export default Hero;
