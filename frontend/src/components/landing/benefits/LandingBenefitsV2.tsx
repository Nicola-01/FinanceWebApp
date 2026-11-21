import type { ReactNode } from "react";
import {
  BankProof,
  BudgetProof,
  ChatProof,
  InvestmentsProof,
  SharingProof,
  SpendingProof,
  SubscriptionsProof,
  TrioProof,
} from "./BenefitProofs.tsx";

interface Benefit {
  id: string;
  label: string;
  headline: string;
  body: string;
  proof: ReactNode;
}

const BENEFITS: Benefit[] = [
  {
    id: "leaks",
    label: "Categories and statistics",
    headline: "Find the leaks before they add up.",
    body: "Nested donuts and a Sankey show where every euro went. The trend view flags any category that keeps growing.",
    proof: <SpendingProof />,
  },
  {
    id: "renewals",
    label: "Subscriptions and reminders",
    headline: "No renewal takes you by surprise.",
    body: 'Set rules like "last working day of the month". Each payment lands on a calendar and a timeline, and you get a reminder before it hits.',
    proof: <SubscriptionsProof />,
  },
  {
    id: "budgets",
    label: "Budgets and alerts",
    headline: "Stay under budget without checking daily.",
    body: "Set a monthly limit per category. FinanceWebApp tells you when you get close, by push notification and by email.",
    proof: <BudgetProof />,
  },
  {
    id: "investments",
    label: "Investments",
    headline: "See what you invested, not only what you spent.",
    body: "Tag an investment once. Buying counts as saving, and your liquidity stays honest.",
    proof: <InvestmentsProof />,
  },
  {
    id: "sharing",
    label: "Shared wallets",
    headline: "Run shared money with the people you live with.",
    body: "Share any wallet as Owner, Editor or Viewer. Everyone sees the same numbers, and you decide who can change them.",
    proof: <SharingProof />,
  },
  {
    id: "bank",
    label: "Open Banking and bank rules",
    headline: "Bank transactions file themselves.",
    body: "Link your bank through Open Banking. Rules tag and rename each import, and a matching subscription absorbs its own payment.",
    proof: <BankProof />,
  },
  {
    id: "mcp",
    label: "AI assistant (MCP)",
    headline: "Ask your finances in plain words.",
    body: "Connect Claude to the built-in MCP server. It sees only the wallets you can see, and it can answer or add a transaction for you.",
    proof: <ChatProof />,
  },
  {
    id: "anywhere",
    label: "Offline, currencies, reports",
    headline: "Use it anywhere, in any currency.",
    body: "Log expenses on a plane. Every wallet has its own currency with ECB rates. A monthly report lands in your inbox.",
    proof: <TrioProof />,
  },
];

function BenefitBlock({ index, benefit }: { index: number; benefit: Benefit }) {
  return (
    <article className="flex flex-col gap-[22px] rounded-[var(--r-card)] bg-app-card p-6 shadow-[var(--box-ring)] sm:p-7">
      <div>
        <span className="text-[13px] tabular-nums text-app-faint">
          {String(index + 1).padStart(2, "0")} · {benefit.label}
        </span>
        <h3 className="mt-3 font-display text-[26px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[27px]">
          {benefit.headline}
        </h3>
        <p className="mt-2 text-[15px] leading-normal text-app-muted">
          {benefit.body}
        </p>
      </div>
      {benefit.proof}
    </article>
  );
}

export function LandingBenefitsV2() {
  return (
    <section id="what" className="py-20 max-sm:py-14">
      <p className="text-[13px] font-medium text-app-muted">
        What changes when you use it
      </p>
      <h2 className="mt-2 font-display text-[40px] leading-[1.1] font-bold tracking-[-0.02em] max-sm:text-[32px]">
        Less guessing. More of your money kept.
      </h2>
      <div className="mt-12 grid gap-[18px] md:grid-cols-2">
        {BENEFITS.map((benefit, i) => (
          <BenefitBlock key={benefit.id} index={i} benefit={benefit} />
        ))}
      </div>
    </section>
  );
}

export default LandingBenefitsV2;
