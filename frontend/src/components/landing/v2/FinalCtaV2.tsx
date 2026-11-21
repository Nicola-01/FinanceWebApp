import React from "react";
import { ArrowRight } from "lucide-react";
import Button from "../../ui/Button";
import GithubMark from "../GithubMark";
import { GITHUB_URL } from "../landingDemoData";

interface FinalCtaV2Props {
  ctaLabel: string;
  demoLoading: boolean;
  onPrimaryCta: () => void;
}

/** UI v2 closing band: inverted block (text colour as fill), primary CTA plus GitHub. */
const FinalCtaV2: React.FC<FinalCtaV2Props> = ({
  ctaLabel,
  demoLoading,
  onPrimaryCta,
}) => (
  <section className="px-4 py-14 lg:px-8 lg:py-20">
    <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-[var(--r-hero)] bg-app-text p-8 text-app-bg lg:grid-cols-[1.3fr_1fr] lg:p-14">
      <div>
        <h2 className="font-display text-[32px] leading-[1.05] font-semibold tracking-[-0.03em] lg:text-[54px]">
          Start keeping more this month.
        </h2>
        <p className="mt-4 text-lg opacity-75">
          Free and open source. Try the demo wallet first, no sign-up needed.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          ripple
          fullWidth
          disabled={demoLoading}
          onClick={onPrimaryCta}
        >
          {demoLoading ? "Loading..." : ctaLabel}
          {!demoLoading && <ArrowRight className="h-5 w-5" />}
        </Button>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary" size="lg" fullWidth>
            <GithubMark className="h-5 w-5" />
            View on GitHub
          </Button>
        </a>
      </div>
    </div>
  </section>
);

export default FinalCtaV2;
