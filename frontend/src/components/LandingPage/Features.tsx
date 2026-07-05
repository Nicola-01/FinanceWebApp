import React, { useMemo } from "react";
import { Calendar, Users, WifiOff } from "lucide-react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { TransactionPieChart } from "../../dashboard/tag/CategoryCharts.tsx";
import { CashFlowSankey } from "../../dashboard/statistics/CashFlowSankey.tsx";
import { WalletCardUI } from "../../dashboard/wallet/WalletCard";
import MockTransactionRow from "./MockTransactionRow";
import { useTheme } from "../../utils/ThemeContext";
import { DEMO_TRANSACTIONS, DEMO_WALLETS } from "./landingDemoData";

const Eyebrow: React.FC<{
  tone: "purple" | "pink";
  children: React.ReactNode;
}> = ({ tone, children }) => (
  <div
    className={`font-semibold tracking-wide uppercase text-sm ${
      tone === "purple" ? "text-app-purple" : "text-app-pink"
    }`}
  >
    {children}
  </div>
);

const tagPreviewRows = [
  DEMO_TRANSACTIONS[0], // Salary (income)
  DEMO_TRANSACTIONS[4], // Groceries (expense)
];

const Features: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const muiTheme = useMemo(
    () => createTheme({ palette: { mode: resolvedTheme } }),
    [resolvedTheme],
  );

  return (
    <section
      id="features"
      className="py-24 px-4 max-w-6xl mx-auto space-y-28 scroll-mt-24"
    >
      {/* ── A — Multi-currency wallets ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <div className="flex-1 space-y-6">
          <Eyebrow tone="pink">Multi-currency</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-app-text">
            Unlimited wallets.
            <br />
            Automatic conversions.
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            Create as many wallets as you need — daily spending, travel, one
            shared with your partner. Each wallet has its own base currency, and
            exchange rates are fetched automatically from the{" "}
            <a
              href="https://frankfurter.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-app-purple hover:underline"
            >
              Frankfurter API
            </a>{" "}
            (powered by the European Central Bank), so every balance is shown in
            both the original and the converted amount.
          </p>
        </div>
        <div className="flex-1 w-full flex justify-center pointer-events-none select-none">
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <WalletCardUI wallet={DEMO_WALLETS[0]} isSelected />
            <WalletCardUI wallet={DEMO_WALLETS[1]} isSelected={false} />
          </div>
        </div>
      </div>

      {/* ── B — Hierarchical tags + transactions ───────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <div className="flex-1 w-full order-2 md:order-1 pointer-events-none select-none">
          <div className="flex flex-col gap-2">
            {tagPreviewRows.map((tx, i) => (
              <MockTransactionRow
                key={tx.id}
                transaction={tx}
                isFirst={i === 0}
                isLast={i === tagPreviewRows.length - 1}
              />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-6 order-1 md:order-2">
          <Eyebrow tone="purple">Deep analytics</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-app-text">
            Hierarchical tags.
            <br />
            Rich visualizations.
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            Every transaction is categorized with a full tag hierarchy — parent
            categories with sub-tags, each with its own colour and icon.{" "}
            <span className="text-app-green">Income is always green</span>,{" "}
            <span className="text-app-red">expenses are red</span> — you know
            where you stand at a glance.
          </p>
        </div>
      </div>

      {/* ── C — Nested donut (real chart) ──────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <div className="flex-1 space-y-6">
          <Eyebrow tone="pink">Category breakdown</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-app-text">
            Nested donut charts.
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            Spending is visualized as an interactive{" "}
            <strong className="text-app-text">nested donut</strong> — the inner
            ring groups by parent category, the outer ring breaks into sub-tags.
            Hover any slice to see the exact amount and percentage. It's the
            fastest way to spot where your money goes.
          </p>
        </div>
        <div className="flex-1 w-full">
          <ThemeProvider theme={muiTheme}>
            <TransactionPieChart
              transactions={DEMO_TRANSACTIONS}
              type="EXPENSE"
              title="Distribution"
            />
          </ThemeProvider>
        </div>
      </div>

      {/* ── D — Sankey (real chart) ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <div className="flex-1 w-full order-2 md:order-1">
          <ThemeProvider theme={muiTheme}>
            <CashFlowSankey transactions={DEMO_TRANSACTIONS} />
          </ThemeProvider>
        </div>
        <div className="flex-1 space-y-6 order-1 md:order-2">
          <Eyebrow tone="purple">Cash flow</Eyebrow>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-app-text">
            Sankey diagram.
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            A full <strong className="text-app-text">Sankey diagram</strong>{" "}
            maps every euro from its income source — salary, bonus, investments
            — through a central node and out to each expense category. The width
            of each flow is proportional to the amount, so you instantly see the
            balance between earning and spending.
          </p>
        </div>
      </div>

      {/* ── E — Subscriptions + Collaboration cards ────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-app-input/70 border border-app-border rounded-[var(--r-card)] p-8 backdrop-blur-sm hover:bg-app-hover transition-all hover:-translate-y-1 duration-300">
          <Calendar className="text-app-yellow w-10 h-10 mb-6" />
          <h3 className="text-2xl font-bold mb-3 text-app-text">
            The subscription engine
          </h3>
          <p className="text-app-muted leading-relaxed">
            Go beyond basic "monthly" repeats. A cron-based engine supports
            complex recurrence rules — like "every last working day of the
            month" or "every 2 weeks on Friday." Each subscription renders on an
            interactive calendar and tracks upcoming payments on a timeline.
          </p>
        </div>
        <div className="bg-app-input/70 border border-app-border rounded-[var(--r-card)] p-8 backdrop-blur-sm hover:bg-app-hover transition-all hover:-translate-y-1 duration-300">
          <Users className="text-app-pink w-10 h-10 mb-6" />
          <h3 className="text-2xl font-bold mb-3 text-app-text">
            Wallet collaboration
          </h3>
          <p className="text-app-muted leading-relaxed">
            Share any wallet with other people, with roles —{" "}
            <strong className="text-app-text">Owner</strong>,{" "}
            <strong className="text-app-text">Editor</strong>, or{" "}
            <strong className="text-app-text">Viewer</strong> — so couples,
            roommates, or families can manage shared finances together with the
            right level of control.
          </p>
        </div>
      </div>

      {/* PWA — compact supporting mention */}
      <div className="flex items-center justify-center gap-3 text-app-muted -mt-16">
        <WifiOff className="w-5 h-5 text-app-purple shrink-0" />
        <p className="text-sm md:text-base text-center">
          <span className="text-app-text font-semibold">Offline-first PWA</span>{" "}
          — installable, works offline and syncs your changes when you're back
          online.
        </p>
      </div>
    </section>
  );
};

export default Features;
