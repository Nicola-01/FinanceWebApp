import React from "react";
import { Sparkles, User } from "lucide-react";

/**
 * MCP / LLM integration section — the app ships an OAuth2 MCP server exposing
 * ~25 finance tools, so an LLM client (e.g. Claude) can query and edit your
 * finances. It performs no authorization of its own: every tool forwards the
 * token to the backend, which enforces per-wallet permissions.
 */
const McpSection: React.FC = () => {
  return (
    <section className="py-24 px-4 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
        {/* Copy */}
        <div className="flex-1 space-y-6">
          <div className="text-app-purple font-semibold tracking-wide uppercase text-sm">
            AI-native
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight text-app-text">
            Talk to your finances.
          </h2>
          <p className="text-app-muted text-lg leading-relaxed">
            FinanceWebApp ships its own{" "}
            <strong className="text-app-text">MCP server</strong> — an OAuth2
            authorization server exposing about{" "}
            <strong className="text-app-text">25 finance tools</strong>. Connect
            an LLM client like <strong className="text-app-text">Claude</strong>{" "}
            and just ask: query your spending, add transactions, review
            subscriptions — in plain language.
          </p>
          <p className="text-app-muted leading-relaxed">
            It enforces nothing on its own: every tool forwards your token to
            the backend, which applies the same per-wallet permissions as the
            app. Your assistant only ever sees what you can see.
          </p>
        </div>

        {/* Chat mock */}
        <div className="flex-1 w-full">
          <div className="rounded-[var(--r-card)] border border-app-border bg-app-input/70 backdrop-blur-sm shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] p-5 space-y-4">
            {/* user */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-app-surface border border-app-border flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-app-muted" />
              </div>
              <div className="rounded-[var(--r-input)] bg-app-surface/60 border border-app-border px-4 py-2.5 text-sm text-app-text">
                How much did I spend on restaurants in March?
              </div>
            </div>
            {/* assistant */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-[var(--r-input)] bg-app-surface/60 border border-app-border px-4 py-2.5 text-sm text-app-text space-y-1">
                <p>
                  In March you spent{" "}
                  <span className="font-app-mono tabular-nums font-semibold text-app-red">
                    €95.00
                  </span>{" "}
                  on{" "}
                  <span className="text-app-text font-semibold">
                    Eating Out
                  </span>{" "}
                  across 1 transaction — about 6% of your expenses.
                </p>
                <p className="text-app-muted text-xs">
                  Want me to set a monthly cap for this category?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default McpSection;
