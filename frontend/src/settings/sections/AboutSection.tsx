import React from "react";
import { Card } from "../../components/ui/Card";

const REPO_URL = "https://github.com/Nicola-01/FinanceWebApp/";

// Formats "YYYY-MM-DD" without a time component, avoiding the UTC shift you'd get
// from `new Date("2026-07-02")`.
function formatBuildDate(raw: string): string {
  if (!raw) return "Unknown";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return raw;
  const [, y, m, d] = match;
  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
  return dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** GitHub mark (inlined — the free-brands icon set isn't installed). */
const GithubMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 16 16"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

/** Static app info — migrated from the old AboutAppModal into a settings card. */
export const AboutSection: React.FC = () => {
  // Version + date are injected at runtime into window.__ENV__ by /config.js.
  const appVersion = window.__ENV__?.version || "Local Development";
  const rawDate = window.__ENV__?.date || "";
  const parsedDate = rawDate ? formatBuildDate(rawDate) : "Unknown";

  return (
    <Card>
      {/* Header: logo sits alongside the app name, both aligned on one baseline. */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-app-border bg-app-surface shadow-sm">
          <img
            src="/icon.svg"
            alt="App Logo"
            className="h-10 w-10 object-contain"
          />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-bold tracking-wide text-app-text">
            Finance
            <span className="bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] bg-clip-text text-transparent">
              App
            </span>
          </h3>
          <p className="text-sm text-app-muted">
            Advanced financial dashboard tracking.
          </p>
        </div>
      </div>

      {/* Info box — full width below the header. */}
      <div className="mt-5 space-y-3 rounded-xl border border-app-border bg-app-input p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
            Version
          </span>
          <span className="rounded bg-app-sky/10 px-2 py-0.5 font-mono text-xs font-bold text-app-sky">
            {appVersion}
          </span>
        </div>

        <div className="h-px w-full bg-app-border" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
            Published on
          </span>
          <span className="max-w-[150px] text-right text-xs font-semibold leading-tight text-app-text">
            {parsedDate}
          </span>
        </div>

        <div className="h-px w-full bg-app-border" />

        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-app-muted">
            Source
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-text transition-colors group-hover:text-[var(--brand-1)]">
            <GithubMark className="h-3.5 w-3.5" />
            Open source on GitHub
          </span>
        </a>
      </div>

      <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-app-muted/50">
        Made by Nicola &copy; {new Date().getFullYear()}
      </div>
    </Card>
  );
};
