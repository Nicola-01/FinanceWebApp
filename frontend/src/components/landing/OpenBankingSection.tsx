import React from "react";
import { Landmark, ArrowLeftRight } from "lucide-react";

/**
 * "Coming soon" section for European Open Banking (PSD2) connectivity via
 * EnableBanking — automatic bank transaction import (no wired backend yet).
 */
const OpenBankingSection: React.FC = () => {
  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-[var(--r-card)] border border-dashed border-app-border bg-app-input/40 backdrop-blur-sm p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-app-surface border border-app-border flex items-center justify-center shrink-0 relative">
          <Landmark className="w-8 h-8 text-app-purple" />
          <ArrowLeftRight className="w-4 h-4 text-app-pink absolute -bottom-1 -right-1 bg-app-bg rounded-full p-0.5 box-content border border-app-border" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-app-purple/30 bg-app-purple/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-app-purple mb-3">
            Coming soon
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-app-text mb-3">
            Connect your real bank accounts
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            Link your European bank accounts through the{" "}
            <strong className="text-app-text">Open Banking</strong> standard
            (PSD2, via{" "}
            <a
              href="https://enablebanking.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-app-purple hover:underline"
            >
              EnableBanking
            </a>
            ) and let transactions import themselves — no more manual entry.
            It's on the roadmap and actively being explored.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OpenBankingSection;
