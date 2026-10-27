import React from "react";
import GithubMark from "./GithubMark";
import { GITHUB_URL } from "./landingDemoData";

const STACK = [
  "Spring Boot",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "PostgreSQL",
  "Python (MCP)",
  "Docker",
];

const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-app-border bg-app-bg/80 backdrop-blur-xl py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Brand + GitHub */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/icon.svg"
              alt="FinanceWebApp logo"
              className="h-6 w-6 object-contain"
            />
            <span className="font-semibold text-app-text">FinanceWebApp</span>
            <span className="text-app-muted text-sm">
              — free &amp; open source
            </span>
          </div>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-app-muted hover:text-app-text transition-colors"
          >
            <GithubMark className="w-4 h-4" />
            View source on GitHub
          </a>
        </div>

        {/* Tech stack */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-app-muted mr-1">
            Built with
          </span>
          {STACK.map((tech) => (
            <span
              key={tech}
              className="rounded-[var(--r-sm)] border border-app-border bg-app-input/60 px-2.5 py-1 text-xs text-app-muted"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Fine print */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-app-border pt-6 text-xs text-app-muted/70">
          <span>
            Exchange rates by{" "}
            <a
              href="https://frankfurter.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-app-text transition-colors"
            >
              Frankfurter
            </a>{" "}
            / European Central Bank.
          </span>
          <span>© {new Date().getFullYear()} FinanceWebApp</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
