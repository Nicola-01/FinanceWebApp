import React from "react";

/** UI v2 landing footer: wordmark, fine print with the FX source and copyright. */
const FooterV2: React.FC = () => (
  <footer className="border-t border-app-border px-4 pt-10 pb-8 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center gap-2.5">
        <img src="/icon.svg" alt="" className="h-6 w-6 object-contain" />
        <span className="font-display font-semibold text-app-text">
          FinanceWebApp
        </span>
        <span className="text-sm text-app-muted">· free &amp; open source</span>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-2 border-t border-app-border pt-4 text-xs text-app-faint sm:flex-row">
        <span>
          Exchange rates by{" "}
          <a
            href="https://frankfurter.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-app-text"
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

export default FooterV2;
